/**
 * Dispute model — corresponds to parkshare-disputes table.
 */

export type DisputeStatus = 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'DISMISSED';

export interface Dispute {
  disputeId: string;
  bookingId: string;
  reportedBy: string;
  reason: string;
  description: string;
  evidence: string[];
  status: DisputeStatus;
  resolution?: string;
  resolvedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDisputeInput {
  bookingId: string;
  reason: string;
  description: string;
  evidence?: string[];
}

export interface UpdateDisputeInput {
  status?: DisputeStatus;
  resolution?: string;
}
