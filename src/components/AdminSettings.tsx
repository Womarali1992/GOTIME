import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Clock, Calendar, Users, CreditCard, AlertCircle, Save, RefreshCw } from 'lucide-react';
import { ReservationSettings, DaySettings } from '@/lib/types';
import { reservationSettings, updateReservationSettings } from '@/lib/data';
import { validateReservationSettings, validateDaySettings } from '@/lib/utils';

interface AdminSettingsProps {
  onSettingsUpdate?: (settings: ReservationSettings) => void;
}

const AdminSettings: React.FC<AdminSettingsProps> = ({ onSettingsUpdate }) => {
  const [settings, setSettings] = useState<ReservationSettings>(reservationSettings);
  const [isEditing, setIsEditing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setSettings(reservationSettings);
  }, []);

  const handleSettingChange = (key: keyof ReservationSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value,
    }));
    setHasChanges(true);
  };

  const handleDaySettingChange = (dayIndex: number, key: keyof DaySettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      operatingHours: prev.operatingHours.map((day, index) =>
        index === dayIndex ? { ...day, [key]: value } : day
      ),
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      // Validate settings before saving
      const generalErrors = validateReservationSettings(settings);
      const dayErrors = validateDaySettings(settings.operatingHours);
      const allErrors = [...generalErrors, ...dayErrors];
      
      if (allErrors.length > 0) {
        // Show validation errors
        console.error('Validation errors:', allErrors);
        alert(`Please fix the following errors:\n\n${allErrors.join('\n')}`);
        return;
      }
      
      const updatedSettings = updateReservationSettings(settings);
      setSettings(updatedSettings);
      setIsEditing(false);
      setHasChanges(false);
      
      if (onSettingsUpdate) {
        onSettingsUpdate(updatedSettings);
      }
      
      // In a real app, you'd make an API call here
      console.log('Settings saved:', updatedSettings);
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Error saving settings. Please try again.');
    }
  };

  const handleReset = () => {
    setSettings(reservationSettings);
    setHasChanges(false);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setSettings(reservationSettings);
    setHasChanges(false);
    setIsEditing(false);
  };

  const timeOptions = Array.from({ length: 24 }, (_, i) => {
    const hour = i.toString().padStart(2, '0');
    return `${hour}:00`;
  });

  const durationOptions = [
    { value: 30, label: '30 minutes' },
    { value: 45, label: '45 minutes' },
    { value: 60, label: '1 hour' },
    { value: 90, label: '1.5 hours' },
    { value: 120, label: '2 hours' },
  ];

  const breakTimeOptions = [
    { value: 0, label: 'No break' },
    { value: 15, label: '15 minutes' },
    { value: 30, label: '30 minutes' },
    { value: 45, label: '45 minutes' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Reservation Settings
          </h2>
          <p className="text-muted-foreground">
            Configure how the reservation system operates
          </p>
        </div>
        <div className="flex gap-2">
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)} className="bg-primary hover:bg-primary/90">
              Edit Settings
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={!hasChanges}
                className="bg-primary hover:bg-primary/90"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </>
          )}
        </div>
      </div>

      {/* General Settings */}
      <Card className="border border-border/50 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            General Settings
          </CardTitle>
          <CardDescription>
            Configure basic reservation rules and limits
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="advanceBookingLimit">Advance Booking Limit</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="advanceBookingLimit"
                  type="number"
                  min="1"
                  max="168"
                  value={settings.advanceBookingLimit}
                  onChange={(e) => handleSettingChange('advanceBookingLimit', parseInt(e.target.value))}
                  disabled={!isEditing}
                  className="flex-1"
                />
                <span className="text-sm text-muted-foreground">hours</span>
              </div>
              <p className="text-xs text-muted-foreground">
                How many hours in advance users can book
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cancellationDeadline">Cancellation Deadline</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="cancellationDeadline"
                  type="number"
                  min="0"
                  max="24"
                  value={settings.cancellationDeadline}
                  onChange={(e) => handleSettingChange('cancellationDeadline', parseInt(e.target.value))}
                  disabled={!isEditing}
                  className="flex-1"
                />
                <span className="text-sm text-muted-foreground">hours</span>
              </div>
              <p className="text-xs text-muted-foreground">
                How many hours before the slot users can cancel
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxPlayersPerSlot">Maximum Players per Slot</Label>
              <Input
                id="maxPlayersPerSlot"
                type="number"
                min="1"
                max="8"
                value={settings.maxPlayersPerSlot}
                onChange={(e) => handleSettingChange('maxPlayersPerSlot', parseInt(e.target.value))}
                disabled={!isEditing}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="minPlayersPerSlot">Minimum Players per Slot</Label>
              <Input
                id="minPlayersPerSlot"
                type="number"
                min="1"
                max={settings.maxPlayersPerSlot}
                value={settings.minPlayersPerSlot}
                onChange={(e) => handleSettingChange('minPlayersPerSlot', parseInt(e.target.value))}
                disabled={!isEditing}
              />
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="allowWalkIns">Allow Walk-ins</Label>
                <p className="text-sm text-muted-foreground">
                  Allow users to book same-day slots
                </p>
              </div>
              <Switch
                id="allowWalkIns"
                checked={settings.allowWalkIns}
                onCheckedChange={(checked) => handleSettingChange('allowWalkIns', checked)}
                disabled={!isEditing}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="requirePayment">Require Payment</Label>
                <p className="text-sm text-muted-foreground">
                  Require payment confirmation for bookings
                </p>
              </div>
              <Switch
                id="requirePayment"
                checked={settings.requirePayment}
                onCheckedChange={(checked) => handleSettingChange('requirePayment', checked)}
                disabled={!isEditing}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Operating Hours */}
      <Card className="border border-border/50 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Operating Hours
          </CardTitle>
          <CardDescription>
            Set operating hours and time slot configurations for each day
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {settings.operatingHours.map((day, index) => (
            <div key={day.dayOfWeek} className="border border-border/30 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Badge variant={day.isOpen ? "default" : "secondary"}>
                    {day.dayOfWeek.charAt(0).toUpperCase() + day.dayOfWeek.slice(1)}
                  </Badge>
                  <Switch
                    checked={day.isOpen}
                    onCheckedChange={(checked) => handleDaySettingChange(index, 'isOpen', checked)}
                    disabled={!isEditing}
                  />
                  <span className="text-sm text-muted-foreground">
                    {day.isOpen ? 'Open' : 'Closed'}
                  </span>
                </div>
              </div>

              {day.isOpen && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Start Time</Label>
                    <Select
                      value={day.startTime}
                      onValueChange={(value) => handleDaySettingChange(index, 'startTime', value)}
                      disabled={!isEditing}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {timeOptions.map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>End Time</Label>
                    <Select
                      value={day.endTime}
                      onValueChange={(value) => handleDaySettingChange(index, 'endTime', value)}
                      disabled={!isEditing}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {timeOptions.map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Slot Duration</Label>
                    <Select
                      value={day.timeSlotDuration.toString()}
                      onValueChange={(value) => handleDaySettingChange(index, 'timeSlotDuration', parseInt(value))}
                      disabled={!isEditing}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {durationOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value.toString()}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Break Time</Label>
                    <Select
                      value={day.breakTime.toString()}
                      onValueChange={(value) => handleDaySettingChange(index, 'breakTime', parseInt(value))}
                      disabled={!isEditing}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {breakTimeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value.toString()}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Summary Card */}
      <Card className="border border-border/50 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Settings Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {settings.operatingHours.filter(day => day.isOpen).length}
              </div>
              <div className="text-sm text-muted-foreground">Days Open</div>
            </div>
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {settings.advanceBookingLimit}h
              </div>
              <div className="text-sm text-muted-foreground">Advance Booking</div>
            </div>
            <div className="text-center p-4 bg-muted/30 rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {settings.maxPlayersPerSlot}
              </div>
              <div className="text-sm text-muted-foreground">Max Players</div>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-muted/20 rounded-lg">
            <div className="text-sm text-muted-foreground">
              <strong>Last Updated:</strong> {new Date(settings.updatedAt).toLocaleString()}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      {isEditing && (
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={handleReset}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset to Defaults
          </Button>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!hasChanges}
            className="bg-primary hover:bg-primary/90"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      )}
    </div>
  );
};

export default AdminSettings;
