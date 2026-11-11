// ============================================
// TASKLYN — Form Store
// Real-time form state management
// ============================================

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { Form, FormResponse, FormParticipant } from "@/types";
import {
  createForm,
  updateForm,
  deleteForm,
  getForm,
  getFormsByTeam,
  subscribeToTeamForms,
  incrementFormResponseCount,
  addFormParticipant,
  removeFormParticipant,
  subscribeToFormParticipants,
  createFormResponse,
  updateFormResponse,
  deleteFormResponse,
  getFormResponses,
  subscribeToFormResponses,
} from "@/lib/firestore";

interface FormState {
  // Forms
  forms: Form[];
  currentForm: Form | null;
  loading: boolean;
  error: string | null;

  // Form participants
  participants: Record<string, FormParticipant[]>;
  participantsLoading: Record<string, boolean>;

  // Form responses
  responses: Record<string, FormResponse[]>;
  responsesLoading: Record<string, boolean>;

  // Actions
  subscribeToTeamForms: (teamId: string) => void;
  unsubscribeFromTeamForms: () => void;
  refreshForms: (teamId: string) => Promise<void>;
  createForm: (
    form: Omit<Form, "id" | "createdAt" | "updatedAt" | "responseCount">,
  ) => Promise<string>;
  updateForm: (formId: string, updates: Partial<Form>) => Promise<void>;
  deleteForm: (formId: string) => Promise<void>;
  setCurrentForm: (form: Form | null) => void;
  getFormById: (formId: string) => Promise<Form | null>;

  // Participant actions
  subscribeToParticipants: (formId: string) => void;
  unsubscribeFromParticipants: (formId: string) => void;
  addParticipant: (
    formId: string,
    participant: Omit<FormParticipant, "id">,
  ) => Promise<void>;
  removeParticipant: (formId: string, userId: string) => Promise<void>;

  // Response actions
  subscribeToResponses: (formId: string) => void;
  unsubscribeFromResponses: (formId: string) => void;
  createResponse: (
    response: Omit<FormResponse, "id" | "submittedAt">,
  ) => Promise<string>;
  updateResponse: (
    formId: string,
    responseId: string,
    updates: Partial<FormResponse>,
  ) => Promise<void>;
  deleteResponse: (formId: string, responseId: string) => Promise<void>;
  getResponses: (formId: string) => Promise<FormResponse[]>;
}

let formsUnsubscribe: (() => void) | null = null;
const participantsUnsubscribes: Record<string, () => void> = {};
const responsesUnsubscribes: Record<string, () => void> = {};

export const useFormStore = create<FormState>()(
  devtools(
    (set, get) => ({
      // Initial state
      forms: [],
      currentForm: null,
      loading: false,
      error: null,
      participants: {},
      participantsLoading: {},
      responses: {},
      responsesLoading: {},

      // Subscribe to team forms
      subscribeToTeamForms: (teamId: string) => {
        console.log("📝 Subscribing to forms for team:", teamId);
        set({ loading: true, error: null });

        formsUnsubscribe?.(); // Cleanup previous subscription

        formsUnsubscribe = subscribeToTeamForms(teamId, (forms) => {
          console.log("📦 Forms received:", forms.length);
          set({ forms, loading: false });
        });
      },

      unsubscribeFromTeamForms: () => {
        formsUnsubscribe?.();
        formsUnsubscribe = null;
        set({ forms: [] });
      },

      refreshForms: async (teamId: string) => {
        set({ loading: true });
        try {
          const forms = await getFormsByTeam(teamId);
          set({ forms, loading: false });
        } catch (error) {
          console.error("Failed to refresh forms:", error);
          set({ error: "Failed to load forms", loading: false });
        }
      },

      createForm: async (form) => {
        try {
          const formId = await createForm(form);
          return formId;
        } catch (error) {
          console.error("Failed to create form:", error);
          throw error;
        }
      },

      updateForm: async (formId, updates) => {
        try {
          await updateForm(formId, updates);
          // Optimistic update
          set((state) => ({
            forms: state.forms.map((f) =>
              f.id === formId ? { ...f, ...updates } : f,
            ),
            currentForm:
              state.currentForm?.id === formId
                ? { ...state.currentForm, ...updates }
                : state.currentForm,
          }));
        } catch (error) {
          console.error("Failed to update form:", error);
          throw error;
        }
      },

      deleteForm: async (formId) => {
        try {
          await deleteForm(formId);
          set((state) => ({
            forms: state.forms.filter((f) => f.id !== formId),
            currentForm:
              state.currentForm?.id === formId ? null : state.currentForm,
          }));
        } catch (error) {
          console.error("Failed to delete form:", error);
          throw error;
        }
      },

      setCurrentForm: (form) => {
        set({ currentForm: form });
      },

      getFormById: async (formId) => {
        try {
          const form = await getForm(formId);
          set({ currentForm: form });
          return form;
        } catch (error) {
          console.error("Failed to get form:", error);
          return null;
        }
      },

      // Participant subscriptions
      subscribeToParticipants: (formId) => {
        console.log("👥 Subscribing to participants for form:", formId);
        set((state) => ({
          participantsLoading: { ...state.participantsLoading, [formId]: true },
        }));

        participantsUnsubscribes[formId]?.(); // Cleanup previous

        participantsUnsubscribes[formId] = subscribeToFormParticipants(
          formId,
          (participants) => {
            console.log("📦 Participants received:", participants.length);
            set((state) => ({
              participants: { ...state.participants, [formId]: participants },
              participantsLoading: {
                ...state.participantsLoading,
                [formId]: false,
              },
            }));
          },
        );
      },

      unsubscribeFromParticipants: (formId) => {
        participantsUnsubscribes[formId]?.();
        delete participantsUnsubscribes[formId];
        set((state) => {
          const newParticipants = { ...state.participants };
          delete newParticipants[formId];
          const newLoading = { ...state.participantsLoading };
          delete newLoading[formId];
          return {
            participants: newParticipants,
            participantsLoading: newLoading,
          };
        });
      },

      addParticipant: async (formId, participant) => {
        try {
          await addFormParticipant(formId, participant);
        } catch (error) {
          console.error("Failed to add participant:", error);
          throw error;
        }
      },

      removeParticipant: async (formId, userId) => {
        try {
          await removeFormParticipant(formId, userId);
        } catch (error) {
          console.error("Failed to remove participant:", error);
          throw error;
        }
      },

      // Response subscriptions
      subscribeToResponses: (formId) => {
        console.log("📝 Subscribing to responses for form:", formId);
        set((state) => ({
          responsesLoading: { ...state.responsesLoading, [formId]: true },
        }));

        responsesUnsubscribes[formId]?.(); // Cleanup previous

        responsesUnsubscribes[formId] = subscribeToFormResponses(
          formId,
          (responses) => {
            console.log("📦 Responses received:", responses.length);
            set((state) => ({
              responses: { ...state.responses, [formId]: responses },
              responsesLoading: { ...state.responsesLoading, [formId]: false },
            }));
          },
        );
      },

      unsubscribeFromResponses: (formId) => {
        responsesUnsubscribes[formId]?.();
        delete responsesUnsubscribes[formId];
        set((state) => {
          const newResponses = { ...state.responses };
          delete newResponses[formId];
          const newLoading = { ...state.responsesLoading };
          delete newLoading[formId];
          return { responses: newResponses, responsesLoading: newLoading };
        });
      },

      createResponse: async (response) => {
        try {
          const responseId = await createFormResponse(response);
          await incrementFormResponseCount(response.formId);
          return responseId;
        } catch (error) {
          console.error("Failed to create response:", error);
          throw error;
        }
      },

      updateResponse: async (formId, responseId, updates) => {
        try {
          await updateFormResponse(formId, responseId, updates);
          // Optimistic update
          set((state) => {
            const formResponses = state.responses[formId] || [];
            return {
              responses: {
                ...state.responses,
                [formId]: formResponses.map((r) =>
                  r.id === responseId ? { ...r, ...updates } : r,
                ),
              },
            };
          });
        } catch (error) {
          console.error("Failed to update response:", error);
          throw error;
        }
      },

      getResponses: async (formId) => {
        try {
          const responses = await getFormResponses(formId);
          set((state) => ({
            responses: { ...state.responses, [formId]: responses },
          }));
          return responses;
        } catch (error) {
          console.error("Failed to get responses:", error);
          return [];
        }
      },

      deleteResponse: async (formId, responseId) => {
        try {
          await deleteFormResponse(formId, responseId);
          set((state) => {
            const formResponses = state.responses[formId] || [];
            return {
              responses: {
                ...state.responses,
                [formId]: formResponses.filter((r) => r.id !== responseId),
              },
            };
          });
        } catch (error) {
          console.error("Failed to delete response:", error);
          throw error;
        }
      },
    }),
    { name: "form-store" },
  ),
);
