# KARMA — IDENTITY PLACEMENT PRD: Frames Only on Pictures, Avatars Never Framed

**Document ID:** LRP-AVATAR-002
**Version:** 1.0 · **Status:** Implemented, verified, on `origin/main`
**Date:** 13 September 2026
**Supersedes:** any conflicting line in LRP-AVATAR-001 (see its v1.1 lock).

> Design read: same realm, correct furniture. Every slot declares what it
> shows with a label; nothing mixes, nothing overlaps, nothing hides.

---

## 1. Terminology lock (binding for code + docs)

| Term | Means | Framed? |
|---|---|---|
| Avatar | One of the six characters | NEVER |
| Profile Picture | Photo / companion / character image choice | YES — only this wears frames |
| Title Box | Name plate | Shows the name, always legible |
| Companion | The chosen friend creature | Never framed, always labeled |

## 2. Placement map

| Slot | Shows | Frame | Label |
|---|---|---|---|
| Sidebar bottom-left | Profile picture | Yes (`FramedAvatar`) | Name + Lv · Rank beside |
| Topbar right | Profile picture | Yes (`FramedAvatar`) | Aria-label |
| Today overview portrait | Avatar (character), plain | No | Name caption |
| Realm nameplate | Picture + Title Box (name legible) | Picture: no (20px); box text shadow strengthened | TITLE BOX |
| Realm hero figure | Avatar, plain | No | CHARACTER |
| Realm companion row | Companion | No | COMPANION |
| Realm picture row | Profile picture | Yes | PROFILE PICTURE |
| Character Card | Avatar plain + picture framed + companion | Picture only | Section labels |
| Personalize preview | Picture framed + avatar plain | Picture only | Both labeled |
| Store price buttons | Real `coin.png` | N/A | — |
| Sidebar brand | KARMA (no RPG suffix) | N/A | — |

## 3. What changed this round

- `FramedAvatar` component (square badge: frame backdrop + inset picture).
- Brand suffix removed; store prices use `CoinImg`.
- Today/Realm/card avatars unframed; title-box name contrast strengthened.
- Realm sections labeled TITLE BOX / CHARACTER / COMPANION / PROFILE PICTURE.

## 4. Acceptance (verified this session)

- `tsc` frontend clean · `next build` 16 routes · contract 43/43.
- No backend/DB change (placement + copy + CSS only).
