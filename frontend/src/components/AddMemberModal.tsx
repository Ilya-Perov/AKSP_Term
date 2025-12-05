import React, { useState } from "react";
import "./modal.css";

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (username: string) => void;
}

export default function AddMemberModal({ open, onClose, onSubmit }: Props) {
  const [username, setUsername] = useState("");

  if (!open) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h2>Добавить участника</h2>

        <input
          type="text"
          placeholder="Введите username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <div className="buttons">
          <button onClick={onClose}>Отмена</button>
          <button
            onClick={() => {
              onSubmit(username);
              setUsername("");
            }}
          >
            Добавить
          </button>
        </div>
      </div>
    </div>
  );
}
