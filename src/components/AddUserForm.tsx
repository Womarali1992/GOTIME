import { useState } from "react";
import BaseForm from "./BaseForm";
import FormField from "./FormField";
import { CreateUser } from "@/lib/types";

interface AddUserFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (user: CreateUser) => void;
}

export default function AddUserForm({ isOpen, onClose, onSave }: AddUserFormProps) {
  const [formData, setFormData] = useState<CreateUser>({
    name: '',
    email: '',
    phone: '',
    membershipType: 'basic',
    duprRating: undefined,
    comments: []
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setFormData({ name: '', email: '', phone: '', membershipType: 'basic', duprRating: undefined, comments: [] });
    onClose();
  };

  const updateField = (field: keyof CreateUser, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const membershipOptions = [
    { value: 'basic', label: 'Basic' },
    { value: 'premium', label: 'Premium' },
    { value: 'admin', label: 'Admin' }
  ];

  return (
    <BaseForm
      isOpen={isOpen}
      onClose={onClose}
      title="Add New User"
      onSubmit={handleSubmit}
      submitText="Add User"
    >
      <FormField
        id="name"
        label="Name"
        type="text"
        value={formData.name}
        onChange={(value) => updateField('name', value)}
        required
      />
      
      <FormField
        id="email"
        label="Email"
        type="email"
        value={formData.email}
        onChange={(value) => updateField('email', value)}
        required
      />
      
      <FormField
        id="phone"
        label="Phone"
        type="tel"
        value={formData.phone}
        onChange={(value) => updateField('phone', value)}
        required
      />
      
      <FormField
        id="membershipType"
        label="Membership Type"
        type="select"
        value={formData.membershipType}
        onChange={(value) => updateField('membershipType', value)}
        options={membershipOptions}
        required
      />
      
      <FormField
        id="duprRating"
        label="DUPR Rating"
        type="number"
        value={formData.duprRating?.toString() || ''}
        onChange={(value) => updateField('duprRating', value ? parseFloat(value) : undefined)}
        placeholder="1.0 - 8.0"
        min="1.0"
        max="8.0"
        step="0.1"
      />
    </BaseForm>
  );
}