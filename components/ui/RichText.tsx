import React from 'react';
import { getUserByHandle } from '../../services/firebase';

interface RichTextProps {
  text: string;
  onViewProfile: (uid: string) => void;
  className?: string;
}

export const RichText: React.FC<RichTextProps> = ({ text, onViewProfile, className }) => {
  if (!text) return null;

  // Split by space or newlines, preserving delimiters
  const parts = text.split(/(\s+)/);

  return (
    <p className={className}>
      {parts.map((part, index) => {
        if (part.startsWith('@') && part.length > 1) {
          // It's a handle
          const handle = part.trim().replace(/[^a-zA-Z0-9_@]/g, ""); // Clean punctuation
          const punctuation = part.replace(handle, ""); // Keep punctuation like "@user."

          return (
            <React.Fragment key={index}>
              <span 
                onClick={async (e) => {
                  e.stopPropagation();
                  try {
                    // Try to find user
                    const user = await getUserByHandle(handle);
                    if (user) {
                      onViewProfile(user.uid);
                    } else {
                      alert(`Пользователь ${handle} не найден.`);
                    }
                  } catch (err) {
                    console.error(err);
                  }
                }}
                className="font-bold cursor-pointer hover:underline text-blue-600 active:text-blue-800"
              >
                {handle}
              </span>
              {punctuation}
            </React.Fragment>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </p>
  );
};
