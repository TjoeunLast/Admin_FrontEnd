import client from "./client";

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

export interface SettlementResponse {
  bank: string;
  settlementId: number;
  orderId: number;
  shipperUserId: number;
  driverUserId: number;
  driverName: string;
  bankName?: string;
  accountNum?: string;
  shipperName: string;
  bizNumber: string;
  paymentId?: number | null;
  paymentMethod?: string | null;
  paymentTiming?: string | null;
  paymentStatus?: string | null;
  paymentAmount?: number | null;
  paymentFeeAmount?: number | null;
  paymentNetAmount?: number | null;
  pgTid?: string | null;
  proofUrl?: string | null;
  paidAt?: string | null;
  confirmedAt?: string | null;
  totalPrice: number;
  status: string;
  feeDate: string;
  feeCompleteDate?: string | null;
}

export type TransportPaymentStatus =
  | "READY"
  | "PAID"
  | "CONFIRMED"
  | "DISPUTED"
  | "ADMIN_HOLD"
  | "ADMIN_FORCE_CONFIRMED"
  | "ADMIN_REJECTED"
  | "CANCELLED";

export type SettlementWorkflowStatus = "READY" | "WAIT" | "COMPLETED";
export type PaymentDisputeStatus =
  | "PENDING"
  | "ADMIN_HOLD"
  | "ADMIN_FORCE_CONFIRMED"
  | "ADMIN_REJECTED";
export type PaymentDisputeReason =
  | "PRICE_MISMATCH"
  | "RECEIVED_AMOUNT_MISMATCH"
  | "PROOF_MISSING"
  | "FRAUD_SUSPECTED"
  | "OTHER";

export interface SettlementStatusSummaryResponse {
  totalAmount: number;
  pendingAmount: number;
  completedAmount: number;
  totalCount: number;
  pendingCount: number;
  completedCount: number;
}

export interface FeePolicyResponse {
  level0Rate: number;
  level1Rate: number;
  level2Rate: number;
  level3PlusRate: number;
  firstPaymentPromoRate: number;
  minFee: number;
  updatedAt: string | null;
}

export interface UpdateFeePolicyRequest {
  level0Rate: number;
  level1Rate: number;
  level2Rate: number;
  level3PlusRate: number;
  firstPaymentPromoRate: number;
  minFee: number;
}

export interface MarkPaymentPaidRequest {
  method?: string;
  paymentTiming?: string;
  proofUrl?: string | null;
  paidAt?: string | null;
}

export interface UpdateTransportPaymentStatusRequest {
  status: TransportPaymentStatus;
  method?: string | null;
  paymentTiming?: string | null;
  proofUrl?: string | null;
  adminMemo?: string | null;
  paidAt?: string | null;
  confirmedAt?: string | null;
}

export interface TransportPaymentResponse {
  paymentId: number;
  orderId: number;
  shipperUserId: number;
  driverUserId: number | null;
  amount: number;
  feeRateSnapshot: number;
  feeAmountSnapshot: number;
  netAmountSnapshot: number;
  method: string;
  paymentTiming: string;
  status: string;
  pgTid: string | null;
  proofUrl: string | null;
  paidAt: string | null;
  confirmedAt: string | null;
}

export interface PaymentDisputeResponse {
  disputeId: number;
  orderId: number;
  paymentId: number;
  requesterUserId: number;
  createdByUserId: number;
  reasonCode: PaymentDisputeReason;
  description: string;
  attachmentUrl: string | null;
  status: PaymentDisputeStatus;
  adminMemo: string | null;
  requestedAt: string;
  processedAt: string | null;
}

export interface CreatePaymentDisputeRequest {
  requesterUserId?: number | null;
  reasonCode: PaymentDisputeReason;
  description: string;
  attachmentUrl?: string | null;
}

export interface UpdatePaymentDisputeStatusRequest {
  status: PaymentDisputeStatus;
  adminMemo?: string | null;
}

export interface PaymentApiTestContextResponse {
  orderId?: number | null;
  disputeId?: number | null;
  invoiceId?: number | null;
  shipperId?: number | null;
  itemId?: number | null;
  driverUserId?: number | null;
  pgOrderId?: string | null;
  paymentKey?: string | null;
  amount?: number | null;
}

const isApiResponse = <T>(value: unknown): value is ApiResponse<T> => {
  if (value === null || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<ApiResponse<T>>;
  return (
    typeof candidate.success === "boolean" &&
    "data" in candidate &&
    "message" in candidate
  );
};

const unwrapApiResponse = <T>(payload: ApiResponse<T> | T): T => {
  if (!isApiResponse<T>(payload)) {
    return payload;
  }

  return payload.data;
};

export const paymentAdminApi = {
  getSettlements: async (status?: string): Promise<SettlementResponse[]> => {
    const response = await client.get<ApiResponse<SettlementResponse[]> | SettlementResponse[]>(
      "/api/v1/settlements/me",
      {
        params: { status },
      }
    );
    return unwrapApiResponse(response.data);
  },

  getSettlementStatusSummary: async (): Promise<SettlementStatusSummaryResponse> => {
    const response = await client.get<
      ApiResponse<SettlementStatusSummaryResponse> | SettlementStatusSummaryResponse
    >(
      "/api/v1/settlements/admin/status-summary"
    );
    return unwrapApiResponse(response.data);
  },

  markPaymentPaid: async (
    orderId: number,
    payload: MarkPaymentPaidRequest
  ): Promise<TransportPaymentResponse> => {
    const response = await client.post<
      ApiResponse<TransportPaymentResponse> | TransportPaymentResponse
    >(`/api/v1/payments/orders/${orderId}/mark-paid`, payload);
    return unwrapApiResponse(response.data);
  },

  updatePaymentStatus: async (
    orderId: number,
    payload: UpdateTransportPaymentStatusRequest
  ): Promise<TransportPaymentResponse> => {
    const response = await client.patch<
      ApiResponse<TransportPaymentResponse> | TransportPaymentResponse
    >(`/api/admin/payment/orders/${orderId}/status`, {
      status: payload.status,
      method: payload.method ?? null,
      paymentTiming: payload.paymentTiming ?? null,
      proofUrl: payload.proofUrl ?? null,
      adminMemo: payload.adminMemo ?? null,
      paidAt: payload.paidAt ?? null,
      confirmedAt: payload.confirmedAt ?? null,
    });
    return unwrapApiResponse(response.data);
  },

  updateSettlementStatus: async (
    orderId: number,
    status: SettlementWorkflowStatus,
    adminMemo?: string | null
  ): Promise<SettlementResponse> => {
    const response = await client.patch<
      ApiResponse<SettlementResponse> | SettlementResponse
    >(`/api/v1/settlements/orders/${orderId}/status`, {
      status,
      adminMemo: adminMemo ?? null,
    });
    return unwrapApiResponse(response.data);
  },

  getCurrentFeePolicy: async (): Promise<FeePolicyResponse> => {
    const response = await client.get<ApiResponse<FeePolicyResponse> | FeePolicyResponse>(
      "/api/admin/payment/fee-policy/current"
    );
    return unwrapApiResponse(response.data);
  },

  updateFeePolicy: async (
    payload: UpdateFeePolicyRequest
  ): Promise<FeePolicyResponse> => {
    const response = await client.patch<
      ApiResponse<FeePolicyResponse> | FeePolicyResponse
    >(
      "/api/admin/payment/fee-policy",
      payload
    );
    return unwrapApiResponse(response.data);
  },

  getPaymentApiTestContext: async (
    orderId: number
  ): Promise<PaymentApiTestContextResponse> => {
    const response = await client.get<
      ApiResponse<PaymentApiTestContextResponse> | PaymentApiTestContextResponse
    >("/api/v1/payments/api-test/context", {
      params: { orderId },
    });
    return unwrapApiResponse(response.data);
  },

  createPaymentDispute: async (
    orderId: number,
    payload: CreatePaymentDisputeRequest
  ): Promise<PaymentDisputeResponse> => {
    const response = await client.post<
      ApiResponse<PaymentDisputeResponse> | PaymentDisputeResponse
    >(`/api/admin/payment/orders/${orderId}/disputes`, payload);
    return unwrapApiResponse(response.data);
  },

  updatePaymentDisputeStatus: async (
    orderId: number,
    disputeId: number,
    payload: UpdatePaymentDisputeStatusRequest
  ): Promise<PaymentDisputeResponse> => {
    const response = await client.patch<
      ApiResponse<PaymentDisputeResponse> | PaymentDisputeResponse
    >(`/api/admin/payment/orders/${orderId}/disputes/${disputeId}/status`, payload);
    return unwrapApiResponse(response.data);
  },
};
