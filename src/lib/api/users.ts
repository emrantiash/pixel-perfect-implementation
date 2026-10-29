import { apiRequest } from "./client";

export interface CreateUserInput {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}

export interface CreateAgentInput extends CreateUserInput {
  companyName: string;
  businessType: string;
  address: string;
  country: string;
  city: string;
  currency?: string;
}

export interface AgentProfileCompletion {
  businessComplete: boolean;
  ownerComplete: boolean;
  percentage: number;
}

export interface MyAgentProfileResponse {
  user: {
    id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string | null;
  };
  businessProfile: {
    id: string;
    companyName: string;
    businessType: string;
    address: string;
    city: string;
    country: string;
    currency: string;
    verificationStatus: string;
    verificationRemarks: string | null;
  } | null;
  ownerProfile: {
    designation: string;
    nidNumber: string;
    dateOfBirth: string | null;
  } | null;
  completion: AgentProfileCompletion;
}

export interface SaveBusinessProfileInput {
  companyName: string;
  businessType: string;
  address: string;
  city: string;
  country: string;
  currency: string;
}

export interface SaveOwnerProfileInput {
  designation: string;
  nidNumber: string;
  dateOfBirth?: string;
}

export interface SaveBusinessProfileInput {
  companyName: string;
  businessType: string;
  address: string;
  city: string;
  country: string;
  currency: string;
}

export interface SaveOwnerProfileInput {
  designation: string;
  nidNumber: string;
  dateOfBirth?: string;
}
export type AgentDocumentType =
  "NID" | "TIN_CERTIFICATE" | "CIVIL_AVIATION_CERTIFICATE" | "TRADE_LICENSE" | "OWNER_PICTURE";

export type AgentDocumentStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface AgentDocument {
  id: string;
  agentId: string;
  type: AgentDocumentType;
  documentNumber: string | null;
  filePath: string | null;
  fileUrl: string | null;
  verificationStatus: AgentDocumentStatus;
  remarks: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CurrentUserResponse {
  id: string;
  clerkUserId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: "ADMIN" | "AGENT" | "CUSTOMER";
  status: string;
  agentProfile: {
    id: string;
  } | null;
}

export const usersApi = {
  createUser(input: CreateUserInput) {
    return apiRequest("/users", {
      method: "POST",
      body: input,
    });
  },

  createAgent(input: CreateAgentInput) {
    return apiRequest("/users/agents", {
      method: "POST",
      body: input,
    });
  },

  getMe() {
    // return apiRequest("/users/me");
    return apiRequest<CurrentUserResponse>("/users/me");
  },

  updateMyProfile(input: { firstName?: string; lastName?: string; phone?: string }) {
    return apiRequest("/users/me/profile", {
      method: "PATCH",
      body: input,
    });
  },

  startAgentRegistration(input: CreateUserInput) {
    return apiRequest("/users/agents/start", {
      method: "POST",
      body: input,
    });
  },

  getMyAgentProfile() {
    return apiRequest<MyAgentProfileResponse>("/users/me/agent-profile");
  },

  saveMyBusinessProfile(input: SaveBusinessProfileInput) {
    return apiRequest("/users/me/agent-profile/business", {
      method: "PATCH",
      body: input,
    });
  },

  saveMyOwnerProfile(input: SaveOwnerProfileInput) {
    return apiRequest("/users/me/agent-profile/owner", {
      method: "PATCH",
      body: input,
    });
  },
  getAgentDocuments(agentId: string) {
    return apiRequest<AgentDocument[]>(`/users/agents/${encodeURIComponent(agentId)}/documents`);
  },

  uploadAgentDocument(
    agentId: string,
    input: {
      type: AgentDocumentType;
      documentNumber?: string;
      file: File;
    },
  ) {
    const formData = new FormData();

    formData.append("type", input.type);

    if (input.documentNumber?.trim()) {
      formData.append("documentNumber", input.documentNumber.trim());
    }

    formData.append("file", input.file);

    return apiRequest<AgentDocument>(`/users/agents/${encodeURIComponent(agentId)}/documents`, {
      method: "POST",
      body: formData,
    });
  },
};
