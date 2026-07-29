export interface TimelineAuditStep {
  stepNumber: number;
  status: string;
  statusLabel: string;
  changedByName: string;
  changedByEmail: string;
  timestampRaw: string;
  dateFormatted: string; // DD-MM-YYYY
  timeFormatted: string; // HH:MM:SS
  dateTimeFormatted: string; // DD-MM-YYYY HH:MM:SS
  durationFromPrevious: {
    text: string;
    formatted: string;
    totalSeconds: number;
  };
  note: string | null;
}

export interface AuditTrailFullData {
  orderInfo: {
    id: string;
    orderNumber: string;
    status: string;
    approvalStatus: string;
    paymentStatus: string;
    fundingType: string;
    totalAmount: number;
    createdAt: string;
    approvedAt: string | null;
    paidAt: string | null;
    completedAt: string | null;
    customerNote: string | null;
  };
  customerInfo: {
    companyName: string;
    companyAddress: string;
    kbliName: string | null;
    responsiblePerson: string;
    responsiblePhone: string;
    responsibleEmail: string;
    headOfCompany: string;
    headPosition: string;
    wlkpStatus: boolean;
    bankName: string;
    bankAccount: string;
    userEmail: string;
    userName: string;
  };
  locationsAndParameters: Array<{
    locationName: string;
    regencyName: string | null;
    districtName: string | null;
    parameterName: string;
    serviceType: string;
    quantity: number;
    price: number;
    subTotal: number;
  }>;
  timeline: {
    steps: TimelineAuditStep[];
    totalDuration: {
      text: string;
      formatted: string;
      totalSeconds: number;
    };
    startDateFormatted: string;
    endDateFormatted: string;
  };
  relatedDocuments: Array<{
    id: string;
    type: string;
    documentNumber: string;
    title: string;
    fileUrl: string;
    fileName: string;
  }>;
}
