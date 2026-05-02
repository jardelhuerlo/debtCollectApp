import { z } from "zod";
import { MIN_PASSWORD_LENGTH } from "@/constants/auth";

export const loginSchema = z.object({
  email: z
    .string({ required_error: "Por favor ingresa tu correo electrónico." })
    .min(1, "Por favor ingresa tu correo electrónico.")
    .email("El correo electrónico no tiene un formato válido."),
  password: z
    .string({ required_error: "Por favor ingresa tu contraseña." })
    .min(1, "Por favor ingresa tu contraseña."),
});

export const signUpSchema = z
  .object({
    fullName: z
      .string({ required_error: "Por favor ingresa tu nombre completo." })
      .min(1, "Por favor ingresa tu nombre completo.")
      .min(2, "El nombre es demasiado corto."),
    email: z
      .string({ required_error: "Por favor ingresa tu correo electrónico." })
      .min(1, "Por favor ingresa tu correo electrónico.")
      .email("El correo electrónico no tiene un formato válido."),
    password: z
      .string({ required_error: "Por favor ingresa tu contraseña." })
      .min(
        MIN_PASSWORD_LENGTH,
        `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`
      )
      .regex(/\d/, "La contraseña debe contener al menos un número."),
    confirmPassword: z.string({ required_error: "Por favor confirma tu contraseña." }),
    acceptedTerms: z.boolean().refine((val) => val === true, {
      message: "Debes aceptar los Términos y Condiciones para continuar.",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden.",
    path: ["confirmPassword"],
  });

export const loanSchema = z.object({
  debtor_name: z
    .string({ required_error: "El nombre del cliente es obligatorio." })
    .min(1, "El nombre del cliente es obligatorio.")
    .min(2, "El nombre es demasiado corto."),
  amount: z
    .string({ required_error: "El monto es obligatorio." })
    .min(1, "El monto es obligatorio.")
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: "El monto debe ser un número mayor a 0.",
    }),
  interes: z
    .string({ required_error: "El interés es obligatorio." })
    .min(1, "El interés es obligatorio.")
    .refine((val) => !isNaN(Number(val)) && Number(val) >= 0 && Number(val) <= 100, {
      message: "El interés debe ser un número entre 0 y 100.",
    }),
  payment_method: z.enum(["efectivo", "transferencia"]),
  note: z.string().optional(),
});

export const paymentSchema = z.object({
  amount: z
    .string({ required_error: "Ingresa un monto válido." })
    .min(1, "Ingresa un monto válido.")
    .refine(
      (val) => {
        const num = Number(val);
        return !isNaN(num) && num > 0;
      },
      {
        message: "El monto debe ser un número mayor a 0.",
      }
    ),
  paymentMethod: z.enum(["efectivo", "transferencia"]),
  paymentNote: z.string().optional(),
});
