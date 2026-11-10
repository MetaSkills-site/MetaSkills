/**
 * @file FormInput.jsx
 * @description A reusable form input component integrated with Radix UI's Form primitives.
 * It provides built-in support for labels, required validation, and custom error messages.
 *
 * @dependencies
 * - radix-ui: For accessible form controls (Form.Control).
 * - Form.styles: Styled components for consistent form appearance.
 *
 * @exports FormInput (default)
 * @interconnections Used in EnterGrade, Login, and various admin forms to maintain UI consistency.
 */

import { Form } from "radix-ui";
import {
  FormField,
  FormLabel,
  FormMessage,
  FormInputStyled,
} from "../styles/Form.styles";

export default function FormInput({
  name,
  type,
  msg,
  valueMissing,
  validation,
  children,
  className,
}) {
  return (
    <FormField
      className={className}
      // Generate a unique name for the field by cleaning the display name
      name={name.toLowerCase().split(" ").join("")}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
        }}
      >
        <FormLabel>{name}</FormLabel>

        {/* Render error messages based on validation states */}
        <FormMessage match="valueMissing">{msg}</FormMessage>
        {validation && (
          <FormMessage match={validation}>{valueMissing}</FormMessage>
        )}
      </div>

      <Form.Control asChild>
        {/* Allows for custom children (like Select) or defaults to a standard styled input */}
        {children ? children : <FormInputStyled type={type} required />}
      </Form.Control>
    </FormField>
  );
}
