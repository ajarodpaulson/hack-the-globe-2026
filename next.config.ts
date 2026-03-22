import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@aws-sdk/client-dynamodb', 'dynamodb-v3', 'ollama'],
};

export default nextConfig;
