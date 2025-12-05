import React, { useState, useEffect } from 'react';
import { familyService, taskService } from '../services/api';
import { useAuth } from '../services/auth';
import { Family, Task } from '../types';

interface DashboardProps {
  onLogout: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onLogout }) => {
  const { user } = useAuth();
  const [families, setFamilies] = useState<Family[]>([]);
  const [selectedFamily, setSelectedFamily] = useState<number | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newFamilyName, setNewFamilyName] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [memberUsername, setMemberUsername] = useState('');
  const [members, setMembers] = useState<any[]>([]);

  useEffect(() => {
    loadFamilies();
  }, []);

  useEffect(() => {
    if (selectedFamily) {
      loadTasks(selectedFamily);
      loadMembers(selectedFamily);
    }
  }, [selectedFamily]);


  const loadFamilies = async () => {
    try {
      const data = await familyService.listFamilies();
      setFamilies(data);
      if (data.length > 0) {
        setSelectedFamily(data[0].id);
      }
    } catch (err) {
      setError('Не удалось загрузить семьи');
    } finally {
      setIsLoading(false);
    }
  };

  const loadTasks = async (familyId: number) => {
    try {
      const data = await taskService.listTasks(familyId);
      setTasks(data);
    } catch (err) {
      setError('Не удалось загрузить задачи');
    }
  };

  const loadMembers = async (familyId: number) => {
    try {
      const data = await familyService.getFamily(familyId);
      setMembers(data.members || []);
    } catch (err) {
      setError("Не удалось загрузить членов семьи");
    }
  };


  const createFamily = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await familyService.createFamily(newFamilyName);
      setNewFamilyName('');
      await loadFamilies();
    } catch (err) {
      setError('Не удалось создать семью');
    }
  };

  const createTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFamily) return;
    try {
      await taskService.createTask(selectedFamily, newTaskTitle, newTaskDesc);
      setNewTaskTitle('');
      setNewTaskDesc('');
      await loadTasks(selectedFamily);
    } catch (err) {
      setError('Не удалось создать задачу');
    }
  };

  const updateTaskStatus = async (taskId: number, newStatus: string) => {
    try {
      const updated = await taskService.updateTask(taskId, { status: newStatus });
      setTasks(tasks.map(t => t.id === taskId ? updated : t));
    } catch (err) {
      setError('Не удалось обновить задачу');
    }
  };

  const addMember = async () => {
    if (!selectedFamily) return;

    try {
      await familyService.addMemberByName(selectedFamily, memberUsername);
      setMemberUsername('');
      setIsAddMemberOpen(false);
      await loadMembers(selectedFamily);
    } catch (err) {
      setError("Не удалось добавить члена семьи");
    }
  };


  const deleteTask = async (taskId: number) => {
    try {
      await taskService.deleteTask(taskId);
      setTasks(tasks.filter(t => t.id !== taskId));
    } catch (err) {
      setError('Не удалось удалить задачу');
    }
  };

  if (isLoading) {
    return <div style={styles.loading}>Загрузка...</div>;
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <h1>Все дома</h1>
          <div>
            <span style={styles.userName}>{user?.username}</span>
            <button onClick={onLogout} style={styles.logoutBtn}>Выйти</button>
          </div>
        </div>
      </header>

      <div style={styles.content}>
        <aside style={styles.sidebar}>
          <div style={styles.section}>
            <h3>Создать семью</h3>
            <form onSubmit={createFamily}>
              <input
                type="text"
                placeholder="Фамилия"
                value={newFamilyName}
                onChange={(e) => setNewFamilyName(e.target.value)}
                style={styles.input}
              />
              <button type="submit" style={styles.button}>Создать</button>
            </form>
          </div>

          <div style={styles.section}>
            <h3>Семьи</h3>
            {families.map(family => (
              <button
                key={family.id}
                onClick={() => setSelectedFamily(family.id)}
                style={{
                  ...styles.familyItem,
                  ...(selectedFamily === family.id ? styles.familyItemActive : {}),
                }}
              >
                {family.name}
              </button>
            ))}
          </div>
        </aside>

        <main style={styles.main}>
          {error && <div style={styles.errorBanner}>{error}</div>}

          {selectedFamily && (
            <>
              <div style={styles.section}>
                <h2>Добавить задачу</h2>
                <form onSubmit={createTask}>
                  <input
                    type="text"
                    placeholder="Название задачи"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    style={styles.input}
                  />
                  <textarea
                    placeholder="Описание (необязательно)"
                    value={newTaskDesc}
                    onChange={(e) => setNewTaskDesc(e.target.value)}
                    style={styles.input}
                  />
                  <button type="submit" style={styles.button}>Добавить задачу</button>
                </form>
              </div>

              <div style={styles.section}>
                <h2>Члены семьи</h2>

                <button
                           style={styles.button}
    onClick={() => setIsAddMemberOpen(true)}
  >
    Добавить члена семьи
  </button>

  <ul style={{ marginTop: "1rem", paddingLeft: "1rem" }}>
    {members.map((m) => (
      <li key={m.id}>
        {m.user.username} — {m.role}
      </li>
    ))}
  </ul>
</div>


              <div style={styles.section}>
                <h2>Задачи</h2>
                <div style={styles.taskList}>
                  {tasks.length === 0 ? (
                    <p>Задач пока нет</p>
                  ) : (
                    tasks.map(task => (
                      <div key={task.id} style={styles.taskCard}>
                        <div>
                          <h4>{task.title}</h4>
                          {task.description && <p>{task.description}</p>}
                          <div style={styles.taskMeta}>
                          </div>
                        </div>
                        <div style={styles.taskActions}>
                          <select
                            value={task.status}
                            onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                            style={styles.select}
                          >
                            <option value="pending">В процессе распределения</option>
                            <option value="in_progress">Выполняется</option>
                            <option value="completed">Завершена</option>
                          </select>
                          <button
                            onClick={() => deleteTask(task.id)}
                            style={styles.deleteBtn}
                          >
                            Удалить
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
          {isAddMemberOpen && (
          <div style={styles.modalBackdrop}>
    <div style={styles.modalContent}>
      <h3>Добавить члена семьи</h3>

      <input
        type="text"
        placeholder="Введите имя пользователя"
        value={memberUsername}
        onChange={(e) => setMemberUsername(e.target.value)}
        style={styles.input}
      />

      <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
        <button style={styles.button} onClick={addMember}>Добавить</button>
        <button
          style={styles.deleteBtn}
          onClick={() => setIsAddMemberOpen(false)}
        >
          Отменить
        </button>
      </div>
    </div>
  </div>
)}

        </main>
      </div>
    </div>
    
  );
  
};

const styles = {
    modalBackdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.55)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  } as React.CSSProperties,

  modalContent: {
    background: "white",
    padding: "2rem",
    borderRadius: "10px",
    width: "320px",
    maxWidth: "90%",
  } as React.CSSProperties,

  container: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    background: '#f9fafb',
  } as React.CSSProperties,
  header: {
    background: 'white',
    borderBottom: '1px solid #e5e7eb',
    padding: '1.5rem',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  } as React.CSSProperties,
  headerContent: {
    maxWidth: '1400px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as React.CSSProperties,
  userName: {
    marginRight: '1rem',
    color: '#6b7280',
  } as React.CSSProperties,
  logoutBtn: {
    padding: '0.5rem 1rem',
    background: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  } as React.CSSProperties,
  content: {
    display: 'flex',
    flex: 1,
    maxWidth: '1400px',
    margin: '0 auto',
    width: '100%',
  } as React.CSSProperties,
  sidebar: {
    width: '280px',
    background: 'white',
    padding: '2rem',
    borderRight: '1px solid #e5e7eb',
    overflow: 'auto',
  } as React.CSSProperties,
  main: {
    flex: 1,
    padding: '2rem',
    overflow: 'auto',
  } as React.CSSProperties,
  section: {
    marginBottom: '2rem',
  } as React.CSSProperties,
  input: {
    width: '100%',
    padding: '0.75rem',
    marginBottom: '0.5rem',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    fontSize: '1rem',
  } as React.CSSProperties,
  button: {
    padding: '0.75rem 1.5rem',
    background: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '600',
  } as React.CSSProperties,
  familyItem: {
    display: 'block',
    width: '100%',
    padding: '0.75rem',
    background: '#f3f4f6',
    border: 'none',
    borderRadius: '6px',
    textAlign: 'left',
    cursor: 'pointer',
    marginBottom: '0.5rem',
    transition: 'all 0.3s ease',
  } as React.CSSProperties,
  familyItemActive: {
    background: '#2563eb',
    color: 'white',
  } as React.CSSProperties,
  taskList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  } as React.CSSProperties,
  taskCard: {
    background: 'white',
    padding: '1rem',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as React.CSSProperties,
  taskMeta: {
    display: 'flex',
    gap: '0.5rem',
    marginTop: '0.5rem',
  } as React.CSSProperties,
  badge: {
    display: 'inline-block',
    padding: '0.25rem 0.75rem',
    background: '#dbeafe',
    color: '#1e40af',
    borderRadius: '12px',
    fontSize: '0.75rem',
    fontWeight: '600',
  } as React.CSSProperties,
  taskActions: {
    display: 'flex',
    gap: '0.5rem',
  } as React.CSSProperties,
  select: {
    padding: '0.5rem',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    cursor: 'pointer',
  } as React.CSSProperties,
  deleteBtn: {
    padding: '0.5rem 1rem',
    background: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  } as React.CSSProperties,
  errorBanner: {
    background: '#fee2e2',
    color: '#dc2626',
    padding: '1rem',
    borderRadius: '6px',
    marginBottom: '1rem',
  } as React.CSSProperties,
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    fontSize: '1.5rem',
    color: '#6b7280',
  } as React.CSSProperties,
  
};
