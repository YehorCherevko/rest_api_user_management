export class InvalidVoteValueError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidVoteValueError";
  }
}
export class VoterNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "VoterNotFoundError";
  }
}

export class UserToVoteForNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UserToVoteForNotFoundError";
  }
}

export class CannotVoteForYourselfError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CannotVoteForYourselfError";
  }
}

export class VotingRateLimitExceededError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "VotingRateLimitExceededError";
  }
}
export class UserNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UserNotFoundError";
  }
}
