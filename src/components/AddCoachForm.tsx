import { useState } from "react";
import BaseForm from "./BaseForm";
import FormField from "./FormField";
import { CreateCoach } from "@/lib/types";

interface AddCoachFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (coach: CreateCoach) => void;
}

export default function AddCoachForm({ isOpen, onClose, onSave }: AddCoachFormProps) {
  const [formData, setFormData] = useState<CreateCoach>({
    name: '',
    email: '',
    phone: '',
    specialties: [],
    bio: '',
    hourlyRate: 0,
  });
  const [newSpecialty, setNewSpecialty] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setFormData({
      name: '',
      email: '',
      phone: '',
      specialties: [],
      bio: '',
      hourlyRate: 0,
    });
    setNewSpecialty('');
    onClose();
  };

  const updateField = (field: keyof CreateCoach, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addSpecialty = () => {
    if (newSpecialty.trim() && !formData.specialties.includes(newSpecialty.trim())) {
      updateField('specialties', [...formData.specialties, newSpecialty.trim()]);
      setNewSpecialty('');
    }
  };

  return (
    <BaseForm
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Coach"
      onSubmit={handleSubmit}
      submitText="Add Coach"
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
        id="hourlyRate"
        label="Hourly Rate ($)"
        type="number"
        value={formData.hourlyRate}
        onChange={(value) => updateField('hourlyRate', value)}
        required
      />
      
      <FormField
        id="bio"
        label="Bio"
        type="textarea"
        value={formData.bio}
        onChange={(value) => updateField('bio', value)}
        placeholder="Brief description of coaching experience..."
        required
      />
      
      <FormField
        id="specialties"
        label="Specialties"
        type="tags"
        value={formData.specialties}
        onChange={(value) => updateField('specialties', value)}
        newValue={newSpecialty}
        onNewValueChange={setNewSpecialty}
        onAddTag={addSpecialty}
        placeholder="e.g., Beginner Lessons"
      />
    </BaseForm>
  );
}