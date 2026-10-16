import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeEmail,
  validateRegistrationInput,
  calculateEventAvailability,
  generateRegistrationRef,
  type EventCapacityState
} from './registrationRules.ts';

test('normalizeEmail trims whitespace and lowercases', () => {
  assert.equal(normalizeEmail('  Alice@Example.COM  '), 'alice@example.com');
  assert.equal(normalizeEmail('BOB.SMITH@DOMAIN.ORG'), 'bob.smith@domain.org');
  assert.equal(normalizeEmail(''), '');
});

test('validateRegistrationInput rejects missing required fields', () => {
  const result = validateRegistrationInput({});
  assert.equal(result.valid, false);
  assert.ok(result.errors.fullName);
  assert.ok(result.errors.email);
  assert.ok(result.errors.organization);
  assert.ok(result.errors.domainInterests);
});

test('validateRegistrationInput rejects invalid email format', () => {
  const result = validateRegistrationInput({
    fullName: 'Jane Doe',
    email: 'not-an-email',
    organization: 'Apex University',
    domainInterests: ['Frontend Development'],
  });
  assert.equal(result.valid, false);
  assert.equal(result.errors.email, 'Please provide a valid email address.');
});

test('validateRegistrationInput passes valid input', () => {
  const result = validateRegistrationInput({
    fullName: 'Jane Doe',
    email: 'jane@apex.edu',
    organization: 'Apex University',
    domainInterests: ['Frontend Development', 'Cloud & DevOps'],
  });
  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, {});
});

test('calculateEventAvailability detects capacity reached', () => {
  const fullEvent: EventCapacityState = {
    maxCapacity: 50,
    confirmedRegistrationsCount: 50,
    status: 'upcoming',
    registrationDeadline: new Date(Date.now() + 86400000).toISOString(),
  };
  const result = calculateEventAvailability(fullEvent);
  assert.equal(result.isAvailable, false);
  assert.equal(result.reason, 'CAPACITY_REACHED');
  assert.equal(result.remainingCapacity, 0);
});

test('calculateEventAvailability detects deadline passed', () => {
  const pastEvent: EventCapacityState = {
    maxCapacity: 50,
    confirmedRegistrationsCount: 10,
    status: 'upcoming',
    registrationDeadline: new Date(Date.now() - 10000).toISOString(),
  };
  const result = calculateEventAvailability(pastEvent);
  assert.equal(result.isAvailable, false);
  assert.equal(result.reason, 'DEADLINE_PASSED');
  assert.equal(result.remainingCapacity, 40);
});

test('calculateEventAvailability detects cancelled event', () => {
  const cancelledEvent: EventCapacityState = {
    maxCapacity: 50,
    confirmedRegistrationsCount: 10,
    status: 'cancelled',
    registrationDeadline: new Date(Date.now() + 86400000).toISOString(),
  };
  const result = calculateEventAvailability(cancelledEvent);
  assert.equal(result.isAvailable, false);
  assert.equal(result.reason, 'CANCELLED');
});

test('calculateEventAvailability allows registration when valid', () => {
  const openEvent: EventCapacityState = {
    maxCapacity: 100,
    confirmedRegistrationsCount: 42,
    status: 'upcoming',
    registrationDeadline: new Date(Date.now() + 86400000).toISOString(),
  };
  const result = calculateEventAvailability(openEvent);
  assert.equal(result.isAvailable, true);
  assert.equal(result.remainingCapacity, 58);
});

test('generateRegistrationRef produces unique code', () => {
  const ref1 = generateRegistrationRef();
  const ref2 = generateRegistrationRef();
  assert.ok(ref1.startsWith('EVF-'));
  assert.ok(ref2.startsWith('EVF-'));
  assert.notEqual(ref1, ref2);
});
