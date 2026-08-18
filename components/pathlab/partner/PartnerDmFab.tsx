"use client";

import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import {
  PARTNER_CONTACT,
  PARTNER_IG_DM_URL,
} from "@/lib/content/pathlab-partner";

/**
 * A floating DM pill so the one door this page has stays within thumb reach
 * after the hero scrolls away. It appears once the hero is behind the
 * reader and steps aside when the closing contact section (with its own
 * full-size CTAs) is in view, so it never covers the payoff.
 */
export function PartnerDmFab() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let pastHero = false;
    let contactInView = false;
    const update = () => setVisible(pastHero && !contactInView);

    const onScroll = () => {
      pastHero = window.scrollY > window.innerHeight * 0.9;
      update();
    };

    const contact = document.getElementById("partner-start");
    const observer = contact
      ? new IntersectionObserver((entries) => {
          contactInView = entries[0]?.isIntersecting ?? false;
          update();
        })
      : null;
    if (contact && observer) observer.observe(contact);

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      observer?.disconnect();
    };
  }, []);

  return (
    <a
      href={PARTNER_IG_DM_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={`pathlab-partner__fab${visible ? " is-visible" : ""}`}
      tabIndex={visible ? 0 : -1}
      aria-hidden={!visible}
    >
      <MessageCircle aria-hidden="true" />
      <span>{PARTNER_CONTACT.primaryLabel}</span>
    </a>
  );
}
