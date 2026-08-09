"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Card,
  FormField,
  Input,
  Select,
  PageHeader,
  FormSection,
  Stepper,
  usePermission,
  ForbiddenState
} from "@kannan19302/ui";
import { useMutation } from "@/lib/data";
import DomainShell from "@/components/domain-shell";
import styles from "../tenants.module.css";

export default function ProvisionTenantPage() {
  const router = useRouter();
  const canProvision = usePermission("system.tenant.provision");
  
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    name: "",
    region: "us-east-1",
    plan: "STARTUP",
    ownerEmail: "",
    justification: ""
  });

  const provision = useMutation(async (data: typeof formData) => {
    // In a real implementation this POSTs to the control plane API.
    // For now we simulate the delay.
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { id: "tnt_" + Math.random().toString(36).slice(2, 9) };
  });

  if (!canProvision) {
    return (
      <DomainShell domainId="tenants" title="Provision Tenant">
        <ForbiddenState 
          title="Access restricted" 
          description="You do not have permission to provision new tenants. Please contact an administrator." 
        />
      </DomainShell>
    );
  }

  const handleNext = () => {
    setActiveStep((s) => Math.min(s + 1, 2));
  };

  const handleBack = () => {
    setActiveStep((s) => Math.max(s - 1, 0));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await provision.run(formData);
      router.push("/tenants/directory");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <DomainShell domainId="tenants" title="Provision Tenant">
      <div className={styles.provisionContainer}>
        <PageHeader 
          title="Provision new tenant" 
          description="Set up a new tenant environment and allocate initial quotas."
          breadcrumbs={[
            { label: "Tenants", href: "/tenants" },
            { label: "Provision" }
          ]}
        />
        
        <div className={styles.provisionLayout}>
          <div className={styles.provisionSidebar}>
            <Stepper 
              activeStep={activeStep}
              steps={[
                { label: "Basics", description: "Name and region" },
                { label: "Configuration", description: "Plan and owner" },
                { label: "Review", description: "Confirm and provision" }
              ]}
            />
          </div>
          
          <div className={styles.provisionContent}>
            <form onSubmit={handleSubmit}>
              <Card padding="lg">
                {activeStep === 0 && (
                  <FormSection title="Tenant Basics" description="The core identity and location of the new environment." collapsible={false}>
                    <div className={styles.formGroup}>
                      <FormField label="Tenant Name" htmlFor="tenantName" required>
                        <Input 
                          id="tenantName" 
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="Acme Corp" 
                          required 
                        />
                      </FormField>
                      <FormField label="Primary Region" htmlFor="tenantRegion" required hint="Data residency region. Cannot be changed after provisioning.">
                        <Select 
                          id="tenantRegion"
                          value={formData.region}
                          onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                        >
                          <option value="us-east-1">US East (N. Virginia)</option>
                          <option value="eu-west-1">EU West (Ireland)</option>
                          <option value="ap-southeast-1">AP Southeast (Singapore)</option>
                        </Select>
                      </FormField>
                    </div>
                  </FormSection>
                )}

                {activeStep === 1 && (
                  <FormSection title="Configuration" description="Billing plan and initial owner assignment." collapsible={false}>
                    <div className={styles.formGroup}>
                      <FormField label="Subscription Plan" htmlFor="tenantPlan" required>
                        <Select 
                          id="tenantPlan"
                          value={formData.plan}
                          onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
                        >
                          <option value="FREE">Free Tier</option>
                          <option value="STARTUP">Startup</option>
                          <option value="ENTERPRISE">Enterprise</option>
                        </Select>
                      </FormField>
                      <FormField label="Initial Owner Email" htmlFor="ownerEmail" required hint="This user will receive an invite to complete setup.">
                        <Input 
                          id="ownerEmail" 
                          type="email"
                          value={formData.ownerEmail}
                          onChange={(e) => setFormData({ ...formData, ownerEmail: e.target.value })}
                          placeholder="admin@acme.com" 
                          required 
                        />
                      </FormField>
                    </div>
                  </FormSection>
                )}

                {activeStep === 2 && (
                  <FormSection title="Review and Provision" description="Verify details before spinning up resources." collapsible={false}>
                    <div className={styles.reviewGroup}>
                      <div className={styles.reviewRow}>
                        <span className={styles.reviewLabel}>Name</span>
                        <span className={styles.reviewValue}>{formData.name || "—"}</span>
                      </div>
                      <div className={styles.reviewRow}>
                        <span className={styles.reviewLabel}>Region</span>
                        <span className={styles.reviewValue}>{formData.region}</span>
                      </div>
                      <div className={styles.reviewRow}>
                        <span className={styles.reviewLabel}>Plan</span>
                        <span className={styles.reviewValue}>{formData.plan}</span>
                      </div>
                      <div className={styles.reviewRow}>
                        <span className={styles.reviewLabel}>Owner</span>
                        <span className={styles.reviewValue}>{formData.ownerEmail || "—"}</span>
                      </div>
                      
                      <FormField label="Justification (Audit)" htmlFor="auditJustification" required hint="Required for compliance logging.">
                        <Input 
                          id="auditJustification"
                          value={formData.justification}
                          onChange={(e) => setFormData({ ...formData, justification: e.target.value })}
                          placeholder="JIRA-123: Customer requested via sales channel" 
                          required 
                        />
                      </FormField>
                    </div>
                  </FormSection>
                )}

                <div className={styles.formActions}>
                  {activeStep > 0 ? (
                    <Button type="button" variant="outline" onClick={handleBack} disabled={provision.loading}>
                      Back
                    </Button>
                  ) : <div />}
                  
                  {activeStep < 2 ? (
                    <Button type="button" onClick={handleNext} disabled={!formData.name && activeStep === 0}>
                      Next step
                    </Button>
                  ) : (
                    <Button type="submit" variant="primary" disabled={provision.loading || !formData.justification}>
                      {provision.loading ? "Provisioning..." : "Provision tenant"}
                    </Button>
                  )}
                </div>
              </Card>
            </form>
          </div>
        </div>
      </div>
    </DomainShell>
  );
}
