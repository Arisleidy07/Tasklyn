"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useInvitationStore } from "@/stores/invitationStore";
import { useListStore } from "@/stores/listStore";
import type { Invitation, TaskList } from "@/types";
import Logo from "@/components/shared/Logo";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { motion } from "framer-motion";
import {
  UserPlus,
  X,
  CheckCircle2,
  ListTodo,
  AlertTriangle,
} from "lucide-react";

export default function InviteClient() {
  const params = useParams();
  const router = useRouter();
  const token = params?.token as string;

  const {
    user,
    isAuthenticated,
    login,
    isLoading: authLoading,
  } = useAuthStore();
  const { getInvitation } = useInvitationStore();
  const { getList, addMember, isMember } = useListStore();

  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [list, setList] = useState<TaskList | null>(null);
  const [loading, setLoading] = useState(true);
  const [isExpired, setIsExpired] = useState(false);
  const [alreadyMember, setAlreadyMember] = useState(false);

  // Load invitation and list data
  useEffect(() => {
    const loadData = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      const inv = await getInvitation(token);
      if (!inv) {
        setLoading(false);
        return;
      }

      const listData = await getList(inv.listId);
      if (!listData) {
        setLoading(false);
        return;
      }

      setInvitation(inv);
      setList(listData);
      setIsExpired(new Date(inv.expiresAt) < new Date());

      // Check if already a member when authenticated
      if (user) {
        const isMem = isMember(inv.listId, user.id);
        setAlreadyMember(isMem);
      }

      setLoading(false);
    };

    loadData();
  }, [token, getInvitation, getList, isMember, user]);

  const handleAccept = () => {
    if (!user || !invitation || !list) return;
    addMember(invitation.listId, user.id, invitation.defaultRole);
    router.push(`/lists/${invitation.listId}`);
  };

  const handleDecline = () => {
    router.push("/dashboard");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  // Not found
  if (!invitation || !list) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-sm w-full text-center"
        >
          <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center text-red-500 mx-auto mb-4">
            <AlertTriangle size={24} />
          </div>
          <h1 className="text-lg font-semibold text-gray-900">
            Invalid invitation
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            This invitation link is invalid or has expired.
          </p>
          <Button
            variant="outline"
            className="mt-6"
            onClick={() => router.push("/")}
          >
            Go to TASKLYN
          </Button>
        </motion.div>
      </div>
    );
  }

  // Not logged in
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 via-white to-blue-50 p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-sm w-full text-center"
        >
          <Logo size="lg" className="justify-center mb-8" />
          <div className="p-6 rounded-2xl border border-gray-200 bg-white shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 mx-auto mb-4">
              <UserPlus size={22} />
            </div>
            <h1 className="text-lg font-semibold text-gray-900">
              You&apos;ve been invited
            </h1>
            <p className="text-sm text-gray-500 mt-2">
              Sign in to join{" "}
              <strong className="text-gray-700">{list.name}</strong>
            </p>
            <Button
              className="mt-6 w-full"
              onClick={login}
              isLoading={authLoading}
              size="lg"
              icon={
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
              }
            >
              Continue with Google
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Already a member
  if (alreadyMember) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-sm w-full text-center"
        >
          <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-500 mx-auto mb-4">
            <CheckCircle2 size={24} />
          </div>
          <h1 className="text-lg font-semibold text-gray-900">
            Already a member
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            You&apos;re already a member of{" "}
            <strong className="text-gray-700">{list.name}</strong>.
          </p>
          <Button
            className="mt-6"
            onClick={() => router.push(`/lists/${list.id}`)}
          >
            Open list
          </Button>
        </motion.div>
      </div>
    );
  }

  // Expired
  if (isExpired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-sm w-full text-center"
        >
          <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-500 mx-auto mb-4">
            <AlertTriangle size={24} />
          </div>
          <h1 className="text-lg font-semibold text-gray-900">
            Invitation expired
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            This invitation link has expired. Ask the list owner for a new one.
          </p>
          <Button
            variant="outline"
            className="mt-6"
            onClick={() => router.push("/dashboard")}
          >
            Go to Dashboard
          </Button>
        </motion.div>
      </div>
    );
  }

  // Invitation accept/reject
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-blue-50 p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-sm w-full"
      >
        <Logo size="lg" className="justify-center mb-8" />
        <div className="p-6 rounded-2xl border border-gray-200 bg-white shadow-xl">
          <div className="text-center">
            <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 mx-auto mb-4">
              <ListTodo size={24} />
            </div>
            <h1 className="text-lg font-semibold text-gray-900">Join list</h1>
            <p className="text-sm text-gray-500 mt-2">
              You&apos;ve been invited to join:
            </p>
            <p className="mt-3 text-base font-semibold text-gray-900">
              {list.name}
            </p>
            <div className="flex items-center justify-center gap-2 mt-2">
              <Badge variant="default">
                {list.members.length} member
                {list.members.length !== 1 ? "s" : ""}
              </Badge>
              <Badge variant="blue">Role: {invitation.defaultRole}</Badge>
            </div>
          </div>

          <div className="flex gap-3 mt-8">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleDecline}
              icon={<X size={16} />}
            >
              Decline
            </Button>
            <Button
              className="flex-1"
              onClick={handleAccept}
              icon={<UserPlus size={16} />}
            >
              Accept
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
