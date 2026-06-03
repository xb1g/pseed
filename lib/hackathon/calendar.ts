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

  const formatDate = (d: Date) =>
    d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

  const now = new Date();
  const uid = `booking-${booking.id}@passionseed.org`;
  const method = options.method || "REQUEST";

  const escapeIcal = (str: string) =>
    str
      .replace(/\\/g, "\\\\")
      .replace(/;/g, "\\;")
      .replace(/,/g, "\\,")
      .replace(/\n/g, "\\n");

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:-//PassionSeed//The Next Decade Hackathon//EN`,
    `METHOD:${method}`,
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${formatDate(now)}`,
    `DTSTART:${formatDate(start)}`,
    `DTEND:${formatDate(end)}`,
    `SUMMARY:${escapeIcal(options.summary)}`,
    `DESCRIPTION:${escapeIcal(options.description)}`,
    `ORGANIZER;CN=${escapeIcal(mentor.full_name)}:mailto:${mentor.email}`,
    `ATTENDEE;ROLE=REQ-PARTICIPANT;CN=${escapeIcal(studentName)}:mailto:${studentEmail}`,
    `LOCATION:${escapeIcal(options.location || "Online - Discord")}`,
    "STATUS:CONFIRMED",
    "SEQUENCE:0",
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    "DESCRIPTION:Reminder",
    "TRIGGER:-PT15M",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  // Fold lines at 75 chars per RFC 5545
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

  return folded.join("\r\n") + "\r\n";
}

/**
 * Send a calendar invite email to the mentor when a student books a session.
 */
export async function sendMentorBookingCalendarInvite(
  mentor: MentorProfile,
  booking: MentorBooking,
  studentName: string
): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.log("[Calendar] RESEND_API_KEY not set — skipping calendar invite");
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

  const icsContent = generateCalendarInvite(booking, mentor, studentName, "", {
    summary,
    description,
    location: "Online - Discord",
    method: "REQUEST",
  });

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
          <p style="color: #666; font-size: 14px;">
            The Next Decade Hackathon 2026
          </p>
        </div>
      `,
      text: `Hi ${mentor.full_name},\n\n${studentName} has booked a mentor session with you.\n\nDate: ${dateStr}\nTime: ${timeStr} (${booking.duration_minutes} minutes)\n${booking.notes ? `Notes: ${booking.notes}\n` : ""}\nA calendar invite is attached. Please confirm the booking in your dashboard.\n\nThe Next Decade Hackathon 2026`,
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

  const icsContent = generateCalendarInvite(booking, mentor, studentName, studentEmail, {
    summary,
    description,
    location: `Discord Room ${booking.discord_room}`,
    method: "REQUEST",
  });

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
          <p style="color: #666; font-size: 14px;">
            The Next Decade Hackathon 2026
          </p>
        </div>
      `,
      text: `Hi ${studentName},\n\nYour mentor session with ${mentor.full_name} has been confirmed!\n\nDate: ${dateStr}\nTime: ${timeStr} (${booking.duration_minutes} minutes)\nDiscord Room: ${booking.discord_room}\n${booking.notes ? `Notes: ${booking.notes}\n` : ""}\nA calendar invite is attached. Please join the Discord room on time.\n\nThe Next Decade Hackathon 2026`,
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
