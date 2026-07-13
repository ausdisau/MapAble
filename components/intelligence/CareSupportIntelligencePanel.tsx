"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

 type ReadinessCheck = {
  id: string;
  label: string;
  status: "confirmed" | "attention" | "unknown";
  explanation: string;
  evidence: string[];
};

type SupportIntelligenceResult = {
  generatedAt: string;
 