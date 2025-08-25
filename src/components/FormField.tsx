import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface BaseFieldProps {
  id: string;
  label: string;
  required?: boolean;
  className?: string;
}

interface InputFieldProps extends BaseFieldProps {
  type: 'text' | 'email' | 'tel' | 'number';
  value: string | number;
  onChange: (value: string | number) => void;
  placeholder?: string;
}

interface TextareaFieldProps extends BaseFieldProps {
  type: 'textarea';
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}

interface SelectFieldProps extends BaseFieldProps {
  type: 'select';
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}

interface TagsFieldProps extends BaseFieldProps {
  type: 'tags';
  value: string[];
  onChange: (value: string[]) => void;
  newValue: string;
  onNewValueChange: (value: string) => void;
  onAddTag: () => void;
  placeholder?: string;
}

type FormFieldProps = InputFieldProps | TextareaFieldProps | SelectFieldProps | TagsFieldProps;

export default function FormField(props: FormFieldProps) {
  const { id, label, required, className = "" } = props;

  const renderField = () => {
    switch (props.type) {
      case 'text':
      case 'email':
      case 'tel':
        return (
          <Input
            id={id}
            type={props.type}
            value={props.value as string}
            onChange={(e) => props.onChange(e.target.value)}
            required={required}
            placeholder={props.placeholder}
          />
        );
      
      case 'number':
        return (
          <Input
            id={id}
            type="number"
            value={props.value}
            onChange={(e) => props.onChange(parseFloat(e.target.value) || 0)}
            required={required}
            placeholder={props.placeholder}
          />
        );
      
      case 'textarea':
        return (
          <Textarea
            id={id}
            value={props.value}
            onChange={(e) => props.onChange(e.target.value)}
            required={required}
            placeholder={props.placeholder}
            rows={props.rows}
          />
        );
      
      case 'select':
        return (
          <Select value={props.value} onValueChange={props.onChange} required={required}>
            <SelectTrigger>
              <SelectValue placeholder={props.placeholder} />
            </SelectTrigger>
            <SelectContent>
              {props.options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      
      case 'tags':
        return (
          <div className="space-y-2">
            <div className="flex space-x-2">
              <Input
                value={props.newValue}
                onChange={(e) => props.onNewValueChange(e.target.value)}
                placeholder={props.placeholder}
              />
              <Button type="button" onClick={props.onAddTag} size="sm">
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {props.value.map((tag) => (
                <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                  {tag}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-transparent"
                    onClick={() => props.onChange(props.value.filter(t => t !== tag))}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className={className}>
      <Label htmlFor={id}>{label}{required && ' *'}</Label>
      {renderField()}
    </div>
  );
}
