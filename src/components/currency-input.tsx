"use client";

import React, { useState, ChangeEvent } from "react";

interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'defaultValue'> {
  name: string;
  defaultValue?: number;
}

export function CurrencyInput({ name, defaultValue, className, ...rest }: CurrencyInputProps) {
  const [displayValue, setDisplayValue] = useState<string>(
    defaultValue ? new Intl.NumberFormat("en-US").format(defaultValue) : ""
  );
  const [rawValue, setRawValue] = useState<number | "">(defaultValue ?? "");

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, ""); // Faqat raqamlarni oladi
    if (!val) {
      setDisplayValue("");
      setRawValue("");
      return;
    }
    const num = parseInt(val, 10);
    setDisplayValue(new Intl.NumberFormat("en-US").format(num));
    setRawValue(num);
  };

  return (
    <>
      <input type="hidden" name={name} value={rawValue} />
      <input
        type="text"
        inputMode="numeric"
        value={displayValue}
        onChange={handleChange}
        className={className}
        {...rest}
      />
    </>
  );
}