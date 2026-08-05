"use client";

import { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMembersList } from "@/hooks/useReportJobs";
import type { TaxToNBRItem, CreateTaxToNBRPayload, UpdateTaxToNBRPayload } from "@/types/taxToNBR.types";

interface TaxToNBRFormProps {
  data?: TaxToNBRItem;
  isLoading?: boolean;
  memberId: string;
  onSubmit: (data: CreateTaxToNBRPayload | UpdateTaxToNBRPayload) => Promise<void>;
}

/**
 * Reusable TaxToNBR Form Component
 * Used in CrudDialog for both create and edit operations
 */
export function TaxToNBRForm({ data, isLoading = false, memberId, onSubmit }: TaxToNBRFormProps) {
  const { data: members = [], isLoading: membersLoading } = useMembersList();

  const [selectedMemberId, setSelectedMemberId] = useState<string>("");
  const [formData, setFormData] = useState({
    contractNumber: "",
    trecHolderName: "",
    deducteeTIN: "",
    mobileNumber: "",
    emailAddress: "",
    paymentDate: "",
    fromDate: "",
    toDate: "",
    sectionNumber: "",
    tradeVolume: "",
    cseCommission: "",
    paymentAmount: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Find member by name for edit mode
  const matchingMember = useMemo(() => {
    if (!data?.trecHolderName) return null;
    return members.find((m) => m.memberName === data.trecHolderName) || null;
  }, [data?.trecHolderName, members]);

  // Populate form with data when editing
  useEffect(() => {
    if (data) {
      const timeout = setTimeout(() => {
        if (matchingMember) {
          setSelectedMemberId(matchingMember.memberId);
        }
        setFormData({
          contractNumber: data.contractNumber || "",
          trecHolderName: data.trecHolderName || "",
          deducteeTIN: data.deducteeTIN || "",
          mobileNumber: data.mobileNumber || "",
          emailAddress: data.emailAddress || "",
          paymentDate: data.paymentDate || "",
          fromDate: data.fromDate || "",
          toDate: data.toDate || "",
          sectionNumber: data.sectionNumber || "",
          tradeVolume: data.tradeVolume?.toString() || "",
          cseCommission: data.cseCommission?.toString() || "",
          paymentAmount: data.paymentAmount?.toString() || "",
        });
      }, 0);
      return () => clearTimeout(timeout);
    }
  }, [data, matchingMember]);

  // When a member is selected from the dropdown, auto-fill fields
  const handleMemberSelect = (memberId: string) => {
    setSelectedMemberId(memberId);
    const member = members.find((m) => m.memberId === memberId);
    if (member) {
      setFormData((prev) => ({
        ...prev,
        trecHolderName: member.memberName || "",
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // if (!formData.contractNumber.trim()) {
    //   newErrors.contractNumber = "Contract number is required";
    // }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      const payload = {
        memberId: selectedMemberId || data?.memberId || memberId,
        contractNumber: formData.contractNumber,
        trecHolderName: formData.trecHolderName || undefined,
        deducteeTIN: formData.deducteeTIN || undefined,
        mobileNumber: formData.mobileNumber || undefined,
        emailAddress: formData.emailAddress || undefined,
        paymentDate: formData.paymentDate || undefined,
        fromDate: formData.fromDate || undefined,
        toDate: formData.toDate || undefined,
        sectionNumber: formData.sectionNumber || undefined,
        tradeVolume: formData.tradeVolume ? parseFloat(formData.tradeVolume) : undefined,
        cseCommission: formData.cseCommission ? parseFloat(formData.cseCommission) : undefined,
        paymentAmount: formData.paymentAmount ? parseFloat(formData.paymentAmount) : undefined,
      };
      await onSubmit(payload);
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="trecHolderName">TREC Holder Name *</Label>
          <Select
            value={selectedMemberId}
            onValueChange={handleMemberSelect}
            disabled={isLoading || membersLoading}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={membersLoading ? "Loading members..." : "Select TREC Holder"} />
            </SelectTrigger>
            <SelectContent>
              {members.map((member) => (
                <SelectItem key={member.memberId} value={member.memberId}>
                  [{member.memberId}] {member.memberName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="memberId">Member ID</Label>
          <Input
            id="memberId"
            name="memberId"
            value={selectedMemberId || data?.memberId || memberId}
            disabled
            className="bg-muted"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="contractNumber">Contract Number *</Label>
          <Input
            id="contractNumber"
            name="contractNumber"
            placeholder="CNT-2024-001"
            value={formData.contractNumber}
            onChange={handleChange}
            disabled={isLoading}
          />
          {errors.contractNumber && (
            <p className="text-sm text-red-500">{errors.contractNumber}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="paymentDate">Payment Date</Label>
          <Input
            id="paymentDate"
            name="paymentDate"
            type="date"
            value={formData.paymentDate}
            onChange={handleChange}
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="deducteeTIN">Deductee TIN</Label>
          <Input
            id="deducteeTIN"
            name="deducteeTIN"
            placeholder="TIN"
            value={formData.deducteeTIN}
            onChange={handleChange}
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="mobileNumber">Mobile Number</Label>
          <Input
            id="mobileNumber"
            name="mobileNumber"
            placeholder="+880XXXXXXXXXX"
            value={formData.mobileNumber}
            onChange={handleChange}
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="emailAddress">Email Address</Label>
          <Input
            id="emailAddress"
            name="emailAddress"
            type="email"
            placeholder="email@example.com"
            value={formData.emailAddress}
            onChange={handleChange}
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="fromDate">From Date</Label>
          <Input
            id="fromDate"
            name="fromDate"
            type="date"
            value={formData.fromDate}
            onChange={handleChange}
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="toDate">To Date</Label>
          <Input
            id="toDate"
            name="toDate"
            type="date"
            value={formData.toDate}
            onChange={handleChange}
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sectionNumber">Section Number</Label>
          <Input
            id="sectionNumber"
            name="sectionNumber"
            placeholder="Section"
            value={formData.sectionNumber}
            onChange={handleChange}
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="border-t pt-4">
        <h3 className="text-sm font-semibold mb-4">Financial Details</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="tradeVolume">Trade Volume</Label>
            <Input
              id="tradeVolume"
              name="tradeVolume"
              type="number"
              placeholder="0.00"
              step="0.01"
              value={formData.tradeVolume}
              onChange={handleChange}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cseCommission">CSE Commission</Label>
            <Input
              id="cseCommission"
              name="cseCommission"
              type="number"
              placeholder="0.00"
              step="0.01"
              value={formData.cseCommission}
              onChange={handleChange}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentAmount">Payment Amount</Label>
            <Input
              id="paymentAmount"
              name="paymentAmount"
              type="number"
              placeholder="0.00"
              step="0.01"
              value={formData.paymentAmount}
              onChange={handleChange}
              disabled={isLoading}
            />
          </div>
        </div>
      </div>
    </form>
  );
}

export default TaxToNBRForm;
