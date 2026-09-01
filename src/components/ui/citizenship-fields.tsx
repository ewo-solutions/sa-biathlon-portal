"use client";

import { useState } from "react";

const inputClass = "w-full bg-sage px-4 py-3.5 text-sm text-white placeholder-white/70 outline-none";
const labelClass = "mb-1 block text-sm text-white";

// SA citizen is the default — ID number required, DOB/gender derived from
// it. Toggling to non-SA switches to manual DOB + gender entry and drops
// the ID requirement, for the athletes who don't have an SA ID number.
export function CitizenshipFields({
  defaultIsSaCitizen = true,
  defaultIdNumber = "",
  defaultDateOfBirth = "",
  defaultGender = "",
  idRequired = true,
}: {
  defaultIsSaCitizen?: boolean;
  defaultIdNumber?: string;
  defaultDateOfBirth?: string;
  defaultGender?: string;
  // false on the admin/self-service edit forms, where ID number is already
  // validated at registration and shouldn't block an unrelated field edit.
  idRequired?: boolean;
}) {
  const [isSaCitizen, setIsSaCitizen] = useState(defaultIsSaCitizen);

  return (
    <div className="space-y-4">
      <div className="flex gap-6 text-sm text-white">
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="isSaCitizen"
            value="true"
            checked={isSaCitizen}
            onChange={() => setIsSaCitizen(true)}
          />
          SA citizen
        </label>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="isSaCitizen"
            value="false"
            checked={!isSaCitizen}
            onChange={() => setIsSaCitizen(false)}
          />
          Non-SA citizen
        </label>
      </div>

      {isSaCitizen ? (
        <div>
          <label className={labelClass}>
            SA ID number {idRequired && <span className="text-red-400">*</span>}
          </label>
          <input
            name="idNumber"
            required={idRequired}
            inputMode="numeric"
            pattern="\d{13}"
            maxLength={13}
            placeholder="13 digits, no spaces"
            defaultValue={defaultIdNumber}
            className={inputClass}
          />
          <p className="mt-1 text-xs text-white/60">
            Your date of birth and gender are read directly from your ID number
            {idRequired
              ? " — if you already have an SA Biathlon athlete number, this links your account to it automatically."
              : "."}
          </p>
          {(defaultDateOfBirth || defaultGender) && (
            <p className="mt-2 text-xs text-white/60">
              Currently on file: {defaultDateOfBirth || "—"} · {defaultGender || "—"}
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>
              Date of birth <span className="text-red-400">*</span>
            </label>
            <input
              type="date"
              name="dateOfBirth"
              required
              defaultValue={defaultDateOfBirth}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>
              Gender <span className="text-red-400">*</span>
            </label>
            <select name="gender" required defaultValue={defaultGender} className={inputClass}>
              <option value="">Select…</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
