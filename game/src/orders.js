// The order board: three ticket slots along the top of the stall. New tickets arrive on a timer
// while a slot is free. One ticket is at the wok at a time (ACTIVE); a cooked dish waiting on the
// pass keeps its ticket PLATED until it is served, and the rest wait their turn. Every open
// ticket's patience drains, fastest while it is being cooked and slowest once plated. A ticket
// whose patience runs out is stamped EXPIRED and the cook loses the order. The book never draws
// anything: it reports what happened and the screen decides how to show it.

import { ORDER } from './config.js';
import { pick } from './random.js';

export const TICKET_WAITING = 'waiting';
export const TICKET_ACTIVE = 'active';
export const TICKET_PLATED = 'plated';
export const TICKET_SERVED = 'served';
export const TICKET_EXPIRED = 'expired';

const DRAIN = { waiting: 0.55, active: 1, plated: 0.35 };

export function createOrderBook(random) {
  return {
    slots: new Array(ORDER.slots).fill(null),
    spawnTimer: ORDER.firstAt,
    nextId: 1,
    lastRecipeId: null,
    random,
    served: 0,
    expired: 0,
  };
}

export function freeSlot(book) {
  for (let index = 0; index < book.slots.length; index += 1) if (book.slots[index] === null) return index;
  return -1;
}

export function isOpen(ticket) {
  return ticket !== null && (ticket.state === TICKET_WAITING || ticket.state === TICKET_ACTIVE || ticket.state === TICKET_PLATED);
}

export function openTickets(book) {
  const open = [];
  for (const ticket of book.slots) if (isOpen(ticket)) open.push(ticket);
  return open;
}

export function activeTicket(book) {
  for (const ticket of book.slots) if (ticket !== null && ticket.state === TICKET_ACTIVE) return ticket;
  return null;
}

export function platedTicket(book) {
  for (const ticket of book.slots) if (ticket !== null && ticket.state === TICKET_PLATED) return ticket;
  return null;
}

export function ticketById(book, id) {
  for (const ticket of book.slots) if (ticket !== null && ticket.id === id) return ticket;
  return null;
}

/** The open ticket the window is impatient about: the one with the least patience left. */
export function mostUrgent(book) {
  let urgent = null;
  for (const ticket of book.slots) {
    if (!isOpen(ticket)) continue;
    if (urgent === null || ticket.patience < urgent.patience) urgent = ticket;
  }
  return urgent;
}

/** Deal a fresh ticket into `slot`: a recipe that is not the last one dealt when it can be helped. */
export function dealTicket(book, slot, recipes, rush) {
  let recipe = pick(book.random, recipes);
  if (recipe.id === book.lastRecipeId && recipes.length > 1) {
    recipe = recipes[(recipes.indexOf(recipe) + 1) % recipes.length];
  }
  book.lastRecipeId = recipe.id;
  const patience = rush ? ORDER.rushPatience : ORDER.patience;
  const ticket = {
    id: book.nextId,
    recipe,
    slot,
    state: TICKET_WAITING,
    patience,
    patienceMax: patience,
    stamp: null,
    stampAt: 0,
  };
  book.nextId += 1;
  book.slots[slot] = ticket;
  return ticket;
}

/**
 * Advance the board one step. Returns the tickets that just arrived and the tickets that just ran
 * out, in that order, so the caller can react (sound, score, toasts).
 */
export function tickBook(book, dt, rush, recipes) {
  const spawned = [];
  const expired = [];

  book.spawnTimer -= dt;
  if (book.spawnTimer <= 0) {
    const slot = freeSlot(book);
    if (slot >= 0) {
      spawned.push(dealTicket(book, slot, recipes, rush));
      book.spawnTimer = rush ? ORDER.rushSpawn : ORDER.spawn;
    } else {
      book.spawnTimer = 0.6;
    }
  }

  for (let index = 0; index < book.slots.length; index += 1) {
    const ticket = book.slots[index];
    if (ticket === null) continue;
    if (ticket.state === TICKET_SERVED) {
      ticket.stampAt += dt;
      if (ticket.stampAt >= 0.6) book.slots[index] = null;
      continue;
    }
    if (ticket.state === TICKET_EXPIRED) {
      ticket.stampAt += dt;
      if (ticket.stampAt >= ORDER.expiredHold) book.slots[index] = null;
      continue;
    }
    ticket.patience = Math.max(0, ticket.patience - dt * (DRAIN[ticket.state] ?? 1));
    if (ticket.patience === 0) {
      ticket.state = TICKET_EXPIRED;
      ticket.stamp = 'EXPIRED';
      ticket.stampAt = 0;
      book.expired += 1;
      expired.push(ticket);
    }
  }
  return { spawned, expired };
}

/** The oldest waiting ticket takes over when the wok falls idle. */
export function promoteNext(book) {
  let oldest = null;
  for (const ticket of book.slots) {
    if (ticket !== null && ticket.state === TICKET_WAITING && (oldest === null || ticket.id < oldest.id)) oldest = ticket;
  }
  if (oldest !== null) oldest.state = TICKET_ACTIVE;
  return oldest;
}

export function markServed(ticket) {
  ticket.state = TICKET_SERVED;
  ticket.stamp = 'SERVED';
  ticket.stampAt = 0;
}

export function markPlated(ticket) {
  ticket.state = TICKET_PLATED;
}
