"use client";

import { Account, Client, Databases } from "appwrite";

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;

export const appwriteClient = new Client()
  .setEndpoint(endpoint || "https://cloud.appwrite.io/v1")
  .setProject(projectId || "");

export const account = new Account(appwriteClient);
export const databases = new Databases(appwriteClient);

export const appwriteConfig = {
  databaseId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || "cnr_ai_hub"
};
