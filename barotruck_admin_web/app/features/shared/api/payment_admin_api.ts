import client from "./client";

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

export interface PagedResponse<T> {
  content: T[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
  numberOfElements: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

const DEFAULT_PAGE_FETCH_SIZE = 100;

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
  orderStatus?: string | null;
  paymentId?: number | null;
  paymentMethod?: string | null;
  paymentTiming?: string | null;
  paymentStatus?: string | null;
  paymentAmount?: number | null;
  paymentFeeAmount?: number | null;
  paymentNetAmount?: number | null;
  baseAmount?: number | null;
  shipperFeeRate?: number | null;
  shipperFeeAmount?: number | null;
  shipperPromoApplied?: boolean | null;
  shipperChargeAmount?: number | null;
  driverFeeRate?: number | null;
  driverFeeAmount?: number | null;
  driverPromoApplied?: boolean | null;
  driverPayoutAmount?: number | null;
  tossFeeRate?: number | null;
  tossFeeAmount?: number | null;
  platformGrossRevenue?: number | null;
  platformNetRevenue?: number | null;
  negativeMargin?: boolean | null;
  feePolicyId?: number | null;
  feePolicyAppliedAt?: string | null;
  pgTid?: string | null;
  proofUrl?: string | null;
  paidAt?: string | null;
  confirmedAt?: string | null;
  totalPrice: number;
  status: string;
  payoutStatus?: string | null;
  payoutFailureReason?: string | null;
  payoutRef?: string | null;
  payoutRequestedAt?: string | null;
  payoutCompletedAt?: string | null;
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
export type GatewayTransactionStatus =
  | "PREPARED"
  | "CONFIRMED"
  | "FAILED"
  | "CANCELED";
export type PayoutItemStatus =
  | "READY"
  | "REQUESTED"
  | "COMPLETED"
  | "FAILED"
  | "RETRYING";
export type OrderWorkflowStatus =
  | "REQUESTED"
  | "ACCEPTED"
  | "LOADING"
  | "IN_TRANSIT"
  | "UNLOADING"
  | "COMPLETED"
  | "CANCELLED";
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

export interface FeePolicySideResponse {
  level0Rate: number;
  level1Rate: number;
  level2Rate: number;
  level3PlusRate: number;
}

export interface FeePolicyResponse {
  level0Rate?: number;
  level1Rate?: number;
  level2Rate?: number;
  level3PlusRate?: number;
  firstPaymentPromoRate?: number;
  shipperSide?: FeePolicySideResponse;
  driverSide?: FeePolicySideResponse;
  shipperFirstPaymentPromoRate: number;
  driverFirstTransportPromoRate: number;
  tossRate: number;
  minFee: number;
  updatedAt: string | null;
}

export interface FeePolicySideRequest {
  level0Rate?: number;
  level1Rate?: number;
  level2Rate?: number;
  level3PlusRate?: number;
}

export interface UpdateFeePolicyRequest {
  shipperSide?: FeePolicySideRequest;
  driverSide?: FeePolicySideRequest;
  shipperFirstPaymentPromoRate?: number;
  driverFirstTransportPromoRate?: number;
  tossRate?: number;
  minFee?: number;
  level0Rate?: number;
  level1Rate?: number;
  level2Rate?: number;
  level3PlusRate?: number;
  firstPaymentPromoRate?: number;
}

export interface AdminFeePreviewRequest {
  baseAmount: number;
  shipperLevel?: number;
  driverLevel?: number;
  shipperPromoApplied?: boolean;
  driverPromoApplied?: boolean;
  includeTossFee?: boolean;
}

export interface FeeBreakdownPreviewResponse {
  previewMode?: string | null;
  paymentProvider?: string | null;
  baseAmount: number;
  postTossBaseAmount?: number | null;
  shipperAppliedLevel: number;
  driverAppliedLevel: number | null;
  shipperFeeRate: number;
  driverFeeRate: number | null;
  shipperFeeAmount: number;
  driverFeeAmount: number | null;
  shipperPromoEligible?: boolean;
  driverPromoEligible?: boolean | null;
  shipperPromoApplied: boolean;
  driverPromoApplied: boolean | null;
  shipperMinFeeApplied: boolean;
  driverMinFeeApplied: boolean | null;
  shipperChargeAmount: number;
  driverPayoutAmount: number | null;
  tossFeeRate: number;
  tossFeeAmount: number;
  platformGrossRevenue: number;
  platformNetRevenue: number;
  negativeMargin?: boolean;
  policyConfigId?: number | null;
  policyUpdatedAt: string | null;
}

export interface PaymentAmountSnapshotResponse {
  baseAmount: number | null;
  shipperChargeAmount: number | null;
  shipperFeeRate: number | null;
  shipperFeeAmount: number | null;
  shipperPromoApplied: boolean | null;
  driverFeeRate: number | null;
  driverFeeAmount: number | null;
  driverPromoApplied: boolean | null;
  driverPayoutAmount: number | null;
  tossFeeRate: number | null;
  tossFeeAmount: number | null;
  platformGrossRevenue: number | null;
  platformNetRevenue: number | null;
  feePolicyId: number | null;
  feePolicyAppliedAt: string | null;
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
  amountSnapshot?: PaymentAmountSnapshotResponse | null;
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

export interface PaymentDisputeStatusResponse {
  disputeId: number;
  orderId: number;
  paymentId: number;
  status: PaymentDisputeStatus;
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

export interface CancelTossPaymentRequest {
  cancelReason: string;
  cancelAmount?: number | null;
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

export interface GatewayTransactionStatusResponse {
  txId: number;
  orderId: number;
  provider: string | null;
  status: GatewayTransactionStatus;
  amount: number | null;
  retryCount: number | null;
  expiresAt: string | null;
  approvedAt: string | null;
  nextRetryAt: string | null;
  failCode: string | null;
  failMessage: string | null;
}

export interface TossPaymentCancelHistory {
  cancelAmount: number | null;
  cancelReason: string | null;
  canceledAt: string | null;
  transactionKey: string | null;
  cancelStatus: string | null;
}

export interface TossPaymentLookupResponse {
  paymentKey: string | null;
  orderId: string | null;
  status: string | null;
  method: string | null;
  easyPayProvider: string | null;
  totalAmount: number | null;
  suppliedAmount: number | null;
  vat: number | null;
  approvedAt: string | null;
  lastTransactionAt: string | null;
  cancels: TossPaymentCancelHistory[];
  rawPayload: string | null;
}

export interface TossPaymentComparisonResponse {
  gatewayTransaction: GatewayTransactionStatusResponse | null;
  transportPayment: TransportPaymentResponse | null;
  gatewayLookup: TossPaymentLookupResponse | null;
  mismatch: boolean;
  mismatchReason: string | null;
}

export interface DriverPayoutItemStatusResponse {
  itemId: number;
  orderId: number;
  batchId: number | null;
  driverUserId: number;
  status: PayoutItemStatus;
  retryCount: number | null;
  requestedAt: string | null;
  completedAt: string | null;
  failureReason: string | null;
  payoutRef: string | null;
  sellerId?: string | null;
  sellerRef?: string | null;
  sellerStatus?: string | null;
  webhookStatus?: string | null;
  lastWebhookReceivedAt?: string | null;
  lastWebhookProcessedAt?: string | null;
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

const isPagedResponse = <T,>(value: unknown): value is PagedResponse<T> => {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const candidate = value as Partial<PagedResponse<T>>;
  return (
    Array.isArray(candidate.content) &&
    typeof candidate.number === "number" &&
    typeof candidate.size === "number" &&
    typeof candidate.totalElements === "number" &&
    typeof candidate.totalPages === "number"
  );
};

const normalizePagedResponse = <T,>(
  payload: ApiResponse<PagedResponse<T> | T[]> | PagedResponse<T> | T[]
): PagedResponse<T> => {
  const unwrapped = unwrapApiResponse<PagedResponse<T> | T[]>(payload);

  if (Array.isArray(unwrapped)) {
    return {
      content: unwrapped,
      number: 0,
      size: unwrapped.length,
      totalElements: unwrapped.length,
      totalPages: unwrapped.length > 0 ? 1 : 0,
      numberOfElements: unwrapped.length,
      first: true,
      last: true,
      empty: unwrapped.length === 0,
    };
  }

  if (isPagedResponse<T>(unwrapped)) {
    return unwrapped;
  }

  return {
    content: [],
    number: 0,
    size: 0,
    totalElements: 0,
    totalPages: 0,
    numberOfElements: 0,
    first: true,
    last: true,
    empty: true,
  };
};

const fetchSettlementPage = async (
  page: number = 0,
  size: number = 20,
  status?: string
): Promise<PagedResponse<SettlementResponse>> => {
  const response = await client.get<
    ApiResponse<PagedResponse<SettlementResponse> | SettlementResponse[]> |
    PagedResponse<SettlementResponse> |
    SettlementResponse[]
  >(
    "/api/v1/settlements/admin/list",
    {
      params: { status, page, size },
    }
  );

  return normalizePagedResponse(response.data);
};

const fetchAllSettlements = async (status?: string): Promise<SettlementResponse[]> => {
  const firstPage = await fetchSettlementPage(0, DEFAULT_PAGE_FETCH_SIZE, status);

  if (firstPage.totalPages <= 1) {
    return firstPage.content;
  }

  const remainingPages = await Promise.all(
    Array.from({ length: firstPage.totalPages - 1 }, (_, index) =>
      fetchSettlementPage(index + 1, DEFAULT_PAGE_FETCH_SIZE, status)
    )
  );

  return [
    ...firstPage.content,
    ...remainingPages.flatMap((page) => page.content),
  ];
};

export const paymentAdminApi = {
  getSettlement: async (orderId: number): Promise<SettlementResponse> => {
    const response = await client.get<
      ApiResponse<SettlementResponse> | SettlementResponse
    >(`/api/v1/settlements/orders/${orderId}`);
    return unwrapApiResponse(response.data);
  },

  getSettlements: async (status?: string): Promise<SettlementResponse[]> => {
    return fetchAllSettlements(status);
  },

  getSettlementsPage: async (
    page: number = 0,
    size: number = 20,
    status?: string
  ): Promise<PagedResponse<SettlementResponse>> => {
    return fetchSettlementPage(page, size, status);
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

  previewFeePolicy: async (
    payload: AdminFeePreviewRequest
  ): Promise<FeeBreakdownPreviewResponse> => {
    const response = await client.post<
      ApiResponse<FeeBreakdownPreviewResponse> | FeeBreakdownPreviewResponse
    >(
      "/api/admin/payment/fee-policy/preview",
      {
        baseAmount: payload.baseAmount,
        shipperLevel: payload.shipperLevel ?? 0,
        driverLevel: payload.driverLevel ?? 0,
        shipperPromoApplied: payload.shipperPromoApplied ?? false,
        driverPromoApplied: payload.driverPromoApplied ?? false,
        includeTossFee: payload.includeTossFee ?? true,
      }
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

  getTossPaymentByPaymentKey: async (
    paymentKey: string
  ): Promise<TossPaymentLookupResponse> => {
    const response = await client.get<
      ApiResponse<TossPaymentLookupResponse> | TossPaymentLookupResponse
    >(`/api/admin/payment/toss/payments/${paymentKey}`);
    return unwrapApiResponse(response.data);
  },

  lookupTossPaymentByOrder: async (
    orderId: number
  ): Promise<TossPaymentComparisonResponse> => {
    const response = await client.get<
      ApiResponse<TossPaymentComparisonResponse> | TossPaymentComparisonResponse
    >(`/api/admin/payment/toss/orders/${orderId}/lookup`);
    return unwrapApiResponse(response.data);
  },

  cancelTossOrderPayment: async (
    orderId: number,
    payload: CancelTossPaymentRequest
  ): Promise<TransportPaymentResponse> => {
    const response = await client.post<
      ApiResponse<TransportPaymentResponse> | TransportPaymentResponse
    >(`/api/admin/payment/orders/${orderId}/cancel`, {
      cancelReason: payload.cancelReason,
      cancelAmount: payload.cancelAmount ?? null,
    });
    return unwrapApiResponse(response.data);
  },

  getPaymentDisputeStatus: async (
    orderId: number
  ): Promise<PaymentDisputeStatusResponse> => {
    const response = await client.get<
      ApiResponse<PaymentDisputeStatusResponse> | PaymentDisputeStatusResponse
    >(`/api/admin/payment/orders/${orderId}/disputes/status`);
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

  getTossOrderStatus: async (
    orderId: number
  ): Promise<GatewayTransactionStatusResponse> => {
    const response = await client.get<
      ApiResponse<GatewayTransactionStatusResponse> | GatewayTransactionStatusResponse
    >(`/api/admin/payment/toss/orders/${orderId}/status`);
    return unwrapApiResponse(response.data);
  },

  getPayoutItemStatus: async (
    orderId: number
  ): Promise<DriverPayoutItemStatusResponse> => {
    const response = await client.get<
      ApiResponse<DriverPayoutItemStatusResponse> | DriverPayoutItemStatusResponse
    >(`/api/admin/payment/payout-items/orders/${orderId}/status`);
    return unwrapApiResponse(response.data);
  },

  requestPayoutForOrder: async (
    orderId: number
  ): Promise<DriverPayoutItemStatusResponse> => {
    const response = await client.post<
      ApiResponse<DriverPayoutItemStatusResponse> | DriverPayoutItemStatusResponse
    >(`/api/admin/payment/orders/${orderId}/payouts/request`);
    return unwrapApiResponse(response.data);
  },

  syncPayoutItemStatus: async (
    orderId: number
  ): Promise<DriverPayoutItemStatusResponse> => {
    const response = await client.post<
      ApiResponse<DriverPayoutItemStatusResponse> | DriverPayoutItemStatusResponse
    >(`/api/admin/payment/payout-items/orders/${orderId}/sync`);
    return unwrapApiResponse(response.data);
  },

  retryPayoutItem: async (itemId: number): Promise<boolean> => {
    const response = await client.post<ApiResponse<boolean> | boolean>(
      `/api/admin/payment/payout-items/${itemId}/retry`
    );
    return unwrapApiResponse(response.data);
  },
};
