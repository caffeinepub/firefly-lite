import { useState, useEffect } from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { identity } = useInternetIdentity();
  const [currency, setCurrency] = useState('USD');

  const storageKey = identity ? `firefly-settings-${identity.getPrincipal().toString()}` : null;

  useEffect(() => {
    if (storageKey) {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        try {
          const settings = JSON.parse(stored);
          setCurrency(settings.currency || 'USD');
        } catch (e) {
          console.error('Failed to load settings', e);
        }
      }
    }
  }, [storageKey]);

  const handleSave = () => {
    if (storageKey) {
      const settings = { currency };
      localStorage.setItem(storageKey, JSON.stringify(settings));
      toast.success('Settings saved successfully');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your preferences</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Currency</CardTitle>
          <CardDescription>Set your default currency for displaying amounts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="currency">Default Currency</Label>
            <Input
              id="currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              placeholder="USD"
              className="mt-2 max-w-xs"
            />
            <p className="text-sm text-muted-foreground mt-2">
              Enter a currency code (e.g., USD, EUR, GBP)
            </p>
          </div>
          <Button onClick={handleSave}>Save Settings</Button>
        </CardContent>
      </Card>
    </div>
  );
}
