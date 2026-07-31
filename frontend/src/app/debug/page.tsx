"use client";

import * as Sentry from "@sentry/nextjs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function DebugPage() {
  const testScenarios = [
    {
      name: "Capture Exception",
      fn: () => {
        throw new Error("Test error from debug page");
      },
    },
    {
      name: "Capture Message",
      fn: () => {
        Sentry.captureMessage("Test message", {
          level: "info",
        });
      },
    },
    {
      name: "Add Breadcrumb",
      fn: () => {
        Sentry.addBreadcrumb({
          message: "Test breadcrumb",
          level: "info",
        });
        alert("Breadcrumb added. Check Sentry.");
      },
    },
    {
      name: "Set User Context",
      fn: () => {
        Sentry.setUser({
          id: "test-user",
          email: "test@example.com",
        });
        alert("User context set. Check Sentry.");
      },
    },
    {
      name: "Clear User Context",
      fn: () => {
        Sentry.setUser(null);
        alert("User context cleared.");
      },
    },
  ];

  return (
    <div className="max-w-2xl mx-auto p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Sentry Debug Panel</h1>
        <p className="text-gray-600">
          Use these buttons to test error capturing and tracking. Events should appear in your Sentry dashboard.
        </p>
      </div>

      <Card className="p-6">
        <div className="space-y-4">
          {testScenarios.map((scenario) => (
            <Button
              key={scenario.name}
              onClick={() => {
                try {
                  scenario.fn();
                } catch (error) {
                  Sentry.captureException(error);
                }
              }}
              className="w-full"
            >
              {scenario.name}
            </Button>
          ))}
        </div>
      </Card>

      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h2 className="font-semibold text-blue-900 mb-2">Testing Tips:</h2>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>Go to your Sentry dashboard to see events</li>
          <li>Check browser console for any errors</li>
          <li>Use the Capture Exception button to test error tracking</li>
          <li>Use Set User Context to test user identification</li>
          <li>Session replays are enabled - check Replays section in Sentry</li>
        </ul>
      </div>

      <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <h2 className="font-semibold text-gray-900 mb-2">Environment Info:</h2>
        <dl className="text-sm space-y-2">
          <div>
            <dt className="font-medium text-gray-700">DSN:</dt>
            <dd className="text-gray-600 font-mono break-all">
              {process.env.NEXT_PUBLIC_SENTRY_DSN || "Not set"}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-gray-700">Environment:</dt>
            <dd className="text-gray-600">{process.env.NODE_ENV}</dd>
          </div>
          <div>
            <dt className="font-medium text-gray-700">App Version:</dt>
            <dd className="text-gray-600">
              {process.env.NEXT_PUBLIC_APP_VERSION || "Not set"}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
