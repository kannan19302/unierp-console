"use client";

import React from "react";
import { CrudDrawer } from "@/components/CrudDrawer";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import {
  type SecurityPolicy,
  securityPolicyFormSchema,
  securityPolicyDrawerFields,
} from "@/lib/security-schema";

interface PolicyModalsProps {
  drawerOpen: boolean;
  drawerMode: "create" | "edit";
  selectedPolicy: SecurityPolicy | null;
  onSubmitDrawer: (values: any) => Promise<void>;
  onCloseDrawer: () => void;
  deleteDialogOpen: boolean;
  policyToDelete: SecurityPolicy | null;
  onConfirmDelete: () => Promise<void>;
  onCloseDelete: () => void;
}

export function PolicyModals({
  drawerOpen,
  drawerMode,
  selectedPolicy,
  onSubmitDrawer,
  onCloseDrawer,
  deleteDialogOpen,
  policyToDelete,
  onConfirmDelete,
  onCloseDelete,
}: PolicyModalsProps) {
  return (
    <>
      <CrudDrawer
        open={drawerOpen}
        title={drawerMode === "create" ? "Register Security Policy" : `Edit Policy: ${selectedPolicy?.name}`}
        mode={drawerMode}
        schema={securityPolicyFormSchema}
        fields={securityPolicyDrawerFields}
        initialValues={selectedPolicy || {}}
        onSubmit={onSubmitDrawer}
        onClose={onCloseDrawer}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        title="Delete Security Policy"
        message={`Are you certain you wish to eliminate security policy "${policyToDelete?.name}"? Multi-tenant isolation barriers may be revoked.`}
        confirmLabel="Delete Policy"
        variant="danger"
        requireTyping={true}
        entityName={policyToDelete?.name || ""}
        onConfirm={onConfirmDelete}
        onCancel={onCloseDelete}
      />
    </>
  );
}
