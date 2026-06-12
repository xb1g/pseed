# Design Document: Codebase Cleanup and Dashboard Simplification

**Date:** June 12, 2026  
**Status:** Approved  
**Author:** Antigravity  

---

## 1. Objectives
*   Remove pivoted features and old events to reduce complexity and focus the web app.
*   Hard-delete maps, classrooms, and teams routes and components.
*   Simplify the user dashboard (`/me`) to focus solely on the North Star assessment and the reflection/streak system.

---

## 2. Proposed Deletions

### 2.1 Route Directories (`app/`)
*   `app/map/`
*   `app/classrooms/`
*   `app/teams/`
*   `app/test-classroom/`
*   `app/test-teams/`

### 2.2 API Route Directories (`app/api/`)
*   `app/api/maps/`
*   `app/api/classrooms/`
*   `app/api/test-classroom/`
*   `app/api/user/next-nodes/`

### 2.3 Component Directories (`components/`)
*   `components/map/`
*   `components/classroom/`
*   `components/teams/`
*   `components/song-of-the-day/`

---

## 3. UI Changes

### 3.1 Main Navigation (`components/main-nav.tsx`)
*   Remove links to `/map`, `/classrooms`, and `/teams` from the navigation array.
*   Active items will be: About (`/about`), Seeds (`/seeds`), My Journey (`/me`), and Build (`/build` - admin only).

### 3.2 User Portal (`components/user-portal.tsx`)
*   **Keep**: Welcome greeting & motivational text, North Star Assessment card, Reflection streak card, and Recent Reflections list.
*   **Remove**: "Next Steps" card, Achievement Badges section, `PortalVinyl` player (Song of the Day), and the Tabs system (Workshops, Communities, Reflect tabs).
*   **Structure**: 
    *   Left column (or main top card): North Star Assessment.
    *   Right column: Streak flame card + Recent Reflections list directly underneath.

---

## 4. Implementation Steps
1.  Remove unused file directories from the codebase.
2.  Refactor `components/main-nav.tsx` to simplify navigation items.
3.  Refactor `components/user-portal.tsx` to simplify the dashboard logic and layout.
4.  Verify application builds successfully with no lint or import errors.
