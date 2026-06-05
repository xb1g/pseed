import { Resend } from "resend";
import type { MentorBooking, MentorProfile } from "@/types/mentor";

function getResend(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("Missing RESEND_API_KEY environment variable");
  }
  return new Resend(apiKey);
}

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "hi@noreply.passionseed.org";

function formatDateICS(d: Date) {
  return d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

function escapeIcal(str: string) {
  return str
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

function foldLines(lines: string[]): string[] {
  const folded: string[] = [];
  for (const line of lines) {
    if (line.length <= 75) {
      folded.push(line);
    } else {
      folded.push(line.slice(0, 75));
      let remainder = line.slice(75);
      while (remainder.length > 0) {
        folded.push(" " + remainder.slice(0, 74));
        remainder = remainder.slice(74);
      }
    }
  }
  return folded;
}

function buildGoogleCalendarUrl(
  summary: string,
  description: string,
  location: string,
  start: Date,
  end: Date
): string {
  const dates =
    formatDateICS(start).replace(/Z$/, "") + "/" + formatDateICS(end).replace(/Z$/, "");
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: summary,
    details: description,
    dates: dates,
    location: location,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function buildOutlookCalendarUrl(
  summary: string,
  description: string,
  location: string,
  start: Date,
  end: Date
): string {
  const startStr = start.toISOString();
  const endStr = end.toISOString();
  const params = new URLSearchParams({
    subject: summary,
    body: description,
    startdt: startStr,
    enddt: endStr,
    location: location,
  });
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

function buildCalendarFallbackLinks(
  summary: string,
  description: string,
  location: string,
  start: Date,
  end: Date
): { google: string; outlook: string } {
  return {
    google: buildGoogleCalendarUrl(summary, description, location, start, end),
    outlook: buildOutlookCalendarUrl(summary, description, location, start, end),
  };
}

/**
 * Generate a .ics calendar invite string for a mentor booking.
 * Follows RFC 5545 iCalendar format.
 */
export function generateCalendarInvite(
  booking: MentorBooking,
  mentor: MentorProfile,
  studentName: string,
  studentEmail: string,
  options: {
    summary: string;
    description: string;
    location?: string;
    method?: "REQUEST" | "PUBLISH";
  }
): string {
  const start = new Date(booking.slot_datetime);
  const end = new Date(start.getTime() + booking.duration_minutes * 60 * 1000);

  const now = new Date();
  const uid = `booking-${booking.id}-${Date.now()}@passionseed.org`;
  const method = options.method || "REQUEST";

  const organizerLine = `ORGANIZER;CN=${escapeIcal(mentor.full_name)}:mailto:${mentor.email}`;
  const attendeeLine = studentEmail
    ? `ATTENDEE;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE;CN=${escapeIcal(studentName)}:mailto:${studentEmail}`
    : `ATTENDEE;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE;CN=${escapeIcal(studentName)}:mailto:`;

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "CALSCALE:GREGORIAN",
    `PRODID:-//PassionSeed//The Next Decade Hackathon//EN`,
    `METHOD:${method}`,
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${formatDateICS(now)}`,
    `DTSTART:${formatDateICS(start)}`,
    `DTEND:${formatDateICS(end)}`,
    `SUMMARY:${escapeIcal(options.summary)}`,
    `DESCRIPTION:${escapeIcal(options.description)}`,
    organizerLine,
    attendeeLine,
    `LOCATION:${escapeIcal(options.location || "Online - Discord")}`,
    "STATUS:CONFIRMED",
    "SEQUENCE:0",
    "TRANSP:OPAQUE",
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    "DESCRIPTION:Reminder",
    "TRIGGER:-PT15M",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return foldLines(lines).join("\r\n") + "\r\n";
}

/**
 * Send a calendar invite email to the mentor when a student books a session.
 * Flawless failure modes: email is optional, logs are clear, never throws.
 */
export async function sendMentorBookingCalendarInvite(
  mentor: MentorProfile,
  booking: MentorBooking,
  studentName: string,
  studentEmail?: string
): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.log("[Calendar] RESEND_API_KEY not set — skipping calendar invite");
    return;
  }

  if (!mentor.email || !mentor.email.includes("@")) {
    console.warn("[Calendar] Invalid or missing mentor email — skipping calendar invite");
    return;
  }

  const slotDate = new Date(booking.slot_datetime);
  const dateStr = slotDate.toLocaleDateString("th-TH", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Bangkok",
  });
  const timeStr = slotDate.toLocaleTimeString("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Bangkok",
  });

  const summary = `Mentor Session - ${studentName}`;
  const description = [
    `Mentor session with ${studentName}`,
    booking.notes ? `\nNotes: ${booking.notes}` : "",
    "\n---",
    "The Next Decade Hackathon 2026",
    "PassionSeed",
  ].join("");

  const start = slotDate;
  const end = new Date(start.getTime() + booking.duration_minutes * 60 * 1000);

  const icsContent = generateCalendarInvite(booking, mentor, studentName, studentEmail || "", {
    summary,
    description,
    location: "Online - Discord",
    method: "REQUEST",
  });

  const links = buildCalendarFallbackLinks(
    summary,
    description,
    "Online - Discord",
    start,
    end
  );

  const filename = `passionseed-mentor-session-${booking.id}.ics`;

  try {
    await getResend().emails.send({
      from: `The Next Decade Hackathon 2026 <${FROM_EMAIL}>`,
      to: mentor.email,
      subject: `📅 New Mentor Session Booking - ${dateStr} ${timeStr}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #91C4E3;">New Mentor Session Booked</h1>
          <p>Hi ${mentor.full_name},</p>
          <p><strong>${studentName}</strong> has booked a mentor session with you.</p>
          <div style="margin: 20px 0; padding: 16px; background: #f0f9ff; border-left: 4px solid #91C4E3; border-radius: 4px;">
            <p style="margin: 0; color: #333; font-size: 14px;"><strong>Date:</strong> ${dateStr}</p>
            <p style="margin: 8px 0 0; color: #333; font-size: 14px;"><strong>Time:</strong> ${timeStr} (${booking.duration_minutes} minutes)</p>
            ${booking.notes ? `<p style="margin: 8px 0 0; color: #333; font-size: 14px;"><strong>Notes:</strong> ${booking.notes}</p>` : ""}
          </div>
          <p style="color: #666; font-size: 14px;">
            A calendar invite is attached. Please confirm the booking in your dashboard.
          </p>
          <div style="margin: 20px 0; padding: 12px; background: #f9fafb; border-radius: 4px;">
            <p style="margin: 0 0 8px; color: #333; font-size: 13px;"><strong>Can not add to calendar?</strong> Use these links:</p>
            <a href="${links.google}" style="color: #91C4E3; font-size: 13px; display: inline-block; margin-right: 12px;">Add to Google Calendar</a>
            <a href="${links.outlook}" style="color: #91C4E3; font-size: 13px; display: inline-block;">Add to Outlook</a>
          </div>
          <p style="color: #666; font-size: 14px;">
            The Next Decade Hackathon 2026
          </p>
        </div>
      `,
      text: `Hi ${mentor.full_name},\n\n${studentName} has booked a mentor session with you.\n\nDate: ${dateStr}\nTime: ${timeStr} (${booking.duration_minutes} minutes)\n${booking.notes ? `Notes: ${booking.notes}\n` : ""}\nA calendar invite is attached. Please confirm the booking in your dashboard.\n\nCan not add to calendar?\nGoogle Calendar: ${links.google}\nOutlook: ${links.outlook}\n\nThe Next Decade Hackathon 2026`,
      attachments: [
        {
          filename,
          content: Buffer.from(icsContent).toString("base64"),
        },
      ],
    });
    console.log(`[Calendar] Sent booking invite to mentor ${mentor.email} for booking ${booking.id}`);
  } catch (err) {
    console.error("[Calendar] Failed to send mentor calendar invite:", err);
  }
}

/**
 * Send a calendar invite to the student when mentor confirms the booking.
 * Flawless failure modes: email is optional, logs are clear, never throws.
 */
export async function sendStudentConfirmedCalendarInvite(
  studentEmail: string,
  studentName: string,
  mentor: MentorProfile,
  booking: MentorBooking & { discord_room: number }
): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.log("[Calendar] RESEND_API_KEY not set — skipping calendar invite");
    return;
  }

  if (!studentEmail || !studentEmail.includes("@")) {
    console.warn("[Calendar] Invalid or missing student email — skipping calendar invite");
    return;
  }

  const slotDate = new Date(booking.slot_datetime);
  const dateStr = slotDate.toLocaleDateString("th-TH", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Bangkok",
  });
  const timeStr = slotDate.toLocaleTimeString("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Bangkok",
  });

  const summary = `Mentor Session - ${mentor.full_name}`;
  const description = [
    `Confirmed mentor session with ${mentor.full_name}`,
    `\nDiscord Room: ${booking.discord_room}`,
    booking.notes ? `\nNotes: ${booking.notes}` : "",
    "\n---",
    "The Next Decade Hackathon 2026",
    "PassionSeed",
  ].join("");

  const start = slotDate;
  const end = new Date(start.getTime() + booking.duration_minutes * 60 * 1000);

  const icsContent = generateCalendarInvite(booking, mentor, studentName, studentEmail, {
    summary,
    description,
    location: `Discord Room ${booking.discord_room}`,
    method: "REQUEST",
  });

  const links = buildCalendarFallbackLinks(
    summary,
    description,
    `Discord Room ${booking.discord_room}`,
    start,
    end
  );

  const filename = `passionseed-mentor-confirmed-${booking.id}.ics`;

  try {
    await getResend().emails.send({
      from: `The Next Decade Hackathon 2026 <${FROM_EMAIL}>`,
      to: studentEmail,
      subject: `✅ Mentor Session Confirmed - ${dateStr} ${timeStr}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #91C4E3;">Mentor Session Confirmed ✅</h1>
          <p>Hi ${studentName},</p>
          <p>Your mentor session with <strong>${mentor.full_name}</strong> has been confirmed!</p>
          <div style="margin: 20px 0; padding: 16px; background: #f0f9ff; border-left: 4px solid #91C4E3; border-radius: 4px;">
            <p style="margin: 0; color: #333; font-size: 14px;"><strong>Date:</strong> ${dateStr}</p>
            <p style="margin: 8px 0 0; color: #333; font-size: 14px;"><strong>Time:</strong> ${timeStr} (${booking.duration_minutes} minutes)</p>
            <p style="margin: 8px 0 0; color: #333; font-size: 14px;"><strong>Discord Room:</strong> 🎙 ${booking.discord_room}</p>
            ${booking.notes ? `<p style="margin: 8px 0 0; color: #333; font-size: 14px;"><strong>Notes:</strong> ${booking.notes}</p>` : ""}
          </div>
          <p style="color: #666; font-size: 14px;">
            A calendar invite is attached. Please join the Discord room on time.
          </p>
          <div style="margin: 20px 0; padding: 12px; background: #f9fafb; border-radius: 4px;">
            <p style="margin: 0 0 8px; color: #333; font-size: 13px;"><strong>Can not add to calendar?</strong> Use these links:</p>
            <a href="${links.google}" style="color: #91C4E3; font-size: 13px; display: inline-block; margin-right: 12px;">Add to Google Calendar</a>
            <a href="${links.outlook}" style="color: #91C4E3; font-size: 13px; display: inline-block;">Add to Outlook</a>
          </div>
          <p style="color: #666; font-size: 14px;">
            The Next Decade Hackathon 2026
          </p>
        </div>
      `,
      text: `Hi ${studentName},\n\nYour mentor session with ${mentor.full_name} has been confirmed!\n\nDate: ${dateStr}\nTime: ${timeStr} (${booking.duration_minutes} minutes)\nDiscord Room: ${booking.discord_room}\n${booking.notes ? `Notes: ${booking.notes}\n` : ""}\nA calendar invite is attached. Please join the Discord room on time.\n\nCan not add to calendar?\nGoogle Calendar: ${links.google}\nOutlook: ${links.outlook}\n\nThe Next Decade Hackathon 2026`,
      attachments: [
        {
          filename,
          content: Buffer.from(icsContent).toString("base64"),
        },
      ],
    });
    console.log(`[Calendar] Sent confirmed invite to student ${studentEmail} for booking ${booking.id}`);
  } catch (err) {
    console.error("[Calendar] Failed to send student calendar invite:", err);
  }
}
