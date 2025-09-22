// Simple Task Manager prototype using localStorage
const addBtn = document.getElementById('add-btn');
const titleInput = document.getElementById('task-title');
const descInput = document.getElementById('task-desc');
const prioritySelect = document.getElementById('task-priority');
const dueInput = document.getElementById('task-due');
const tasksList = document.getElementById('tasks-list');
const search = document.getElementById('search');
const filterStatus = document.getElementById('filter-status');
const clearBtn = document.getElementById('clear-btn');


let tasks = JSON.parse(localStorage.getItem('tasks_v1') || '[]');

function save() {
  localStorage.setItem('tasks_v1', JSON.stringify(tasks));
}

function render() {
  const q = (search.value || '').toLowerCase();
  const status = filterStatus.value;
  tasksList.innerHTML = '';
  const filtered = tasks
    .filter((t) => {
      if (status === 'active' && t.done) return false;
      if (status === 'done' && !t.done) return false;
      if (
        q &&
        !(
          t.title.toLowerCase().includes(q) ||
          (t.description || '').toLowerCase().includes(q)
        )
      )
        return false;
      return true;
    })
    .sort(
      (a, b) =>
        a.done - b.done || new Date(a.due || 0) - new Date(b.due || 0)
    );

  // Helper to create a drop zone at a given index in the main tasks array
  function createDropZone(dropIdx) {
    const dz = document.createElement('div');
    dz.className = 'drop-zone';
    dz.ondragover = (e) => {
      e.preventDefault();
      dz.classList.add('active-drop-zone');
    };
    dz.ondragleave = () => {
      dz.classList.remove('active-drop-zone');
    };
    dz.ondrop = (e) => {
      e.preventDefault();
      dz.classList.remove('active-drop-zone');
      const fromIdx = Number(e.dataTransfer.getData('text/plain'));
      if (fromIdx === dropIdx || fromIdx + 1 === dropIdx) return; // No move needed
      const moved = tasks.splice(fromIdx, 1)[0];
      // Adjust dropIdx if moving down the list
      const insertIdx = fromIdx < dropIdx ? dropIdx - 1 : dropIdx;
      tasks.splice(insertIdx, 0, moved);
      save();
      render();
    };
    return dz;
  }

  // Build an array of real indices for the filtered tasks
  const realIndices = filtered.map(t => tasks.findIndex(task => task.id === t.id));

  // Render drop zone before the first card
  tasksList.appendChild(createDropZone(realIndices[0] ?? 0));

  filtered.forEach((t, idx) => {
    const realIndex = realIndices[idx];

    // Render task card
    const div = document.createElement('div');
    div.className = 'task';
    div.draggable = true;
    div.dataset.index = realIndex;

    div.ondragstart = (e) => {
      e.dataTransfer.setData('text/plain', realIndex);
      div.classList.add('dragging');
    };
    div.ondragend = () => {
      div.classList.remove('dragging');
    };
    div.ondragover = (e) => {
      e.preventDefault();
      div.classList.add('drag-over');
    };
    div.ondragleave = () => {
      div.classList.remove('drag-over');
    };
    div.ondrop = (e) => {
      e.preventDefault();
      div.classList.remove('drag-over');
      const fromIdx = Number(e.dataTransfer.getData('text/plain'));
      const toIdx = Number(div.dataset.index);
      if (fromIdx !== toIdx) {
        const moved = tasks.splice(fromIdx, 1)[0];
        tasks.splice(toIdx, 0, moved);
        save();
        render();
      }
    };

    const meta = document.createElement('div');
    meta.className = 'meta';

    const title = document.createElement('h3');
    title.textContent = t.title;
    if (t.done) title.classList.add('done');

    const p = document.createElement('p');
    p.textContent = t.description || '';

    meta.appendChild(title);
    meta.appendChild(p);

    // --- Sub-options logic ---
    // Ensure subOptions and subOptionsDone exist for each task
    if (!t.subOptions) t.subOptions = [];
    if (!t.subOptionsDone) t.subOptionsDone = [];

    const subOptionsDiv = document.createElement('div');
    subOptionsDiv.className = 'sub-options-group';

    // List each sub-option as a radio with edit
    t.subOptions.forEach((label, idx) => {
      const radioWrapper = document.createElement('label');
      radioWrapper.className = 'custom-radio-wrapper';

      // Custom checkbox (Planner style)
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'custom-radio';
      checkbox.name = `suboption-${t.id}`;
      checkbox.id = `suboption-${t.id}-${idx}`;
      checkbox.checked = !!t.subOptionsDone[idx];

      // Toggle done state and editability
      checkbox.onchange = () => {
        t.subOptionsDone[idx] = checkbox.checked;
        save();
        render();
      };

      // Visual circle/checkmark
      const customCheck = document.createElement('span');
      customCheck.className = 'checkmark';

      // Editable text input
      const editInput = document.createElement('input');
      editInput.type = 'text';
      editInput.value = label;
      editInput.disabled = !!t.subOptionsDone[idx];
      editInput.className = 'suboption-edit';

      editInput.onchange = () => {
        t.subOptions[idx] = editInput.value;
        save();
        render();
      };

      // Remove button
      const removeBtn = document.createElement('button');
      removeBtn.textContent = '🗑️';
      removeBtn.className = 'small';
      removeBtn.onclick = (e) => {
        e.preventDefault();
        t.subOptions.splice(idx, 1);
        t.subOptionsDone.splice(idx, 1);
        save();
        render();
      };

      // Style for completed
      if (t.subOptionsDone[idx]) {
        editInput.style.textDecoration = 'line-through';
        editInput.style.opacity = '0.6';
      } else {
        editInput.style.textDecoration = '';
        editInput.style.opacity = '';
      }

      radioWrapper.appendChild(checkbox);
      radioWrapper.appendChild(customCheck);
      radioWrapper.appendChild(editInput);
      radioWrapper.appendChild(removeBtn);
      subOptionsDiv.appendChild(radioWrapper);
      subOptionsDiv.appendChild(document.createElement('br'));
    });

    // Add new sub-option input
    const addInput = document.createElement('input');
    addInput.type = 'text';
    addInput.placeholder = 'Checklist da Tarefa';
    addInput.className = 'suboption-add';
    addInput.style.marginRight = '6px';
    addInput.style.width = '180px';

    const addBtn = document.createElement('button');
    addBtn.textContent = '+';
    addBtn.className = 'small';
    addBtn.onclick = (e) => {
      e.preventDefault();
      const val = addInput.value.trim();
      if (val) {
        t.subOptions.push(val);
        t.subOptionsDone.push(false);
        save();
        render();
      }
    };

    subOptionsDiv.appendChild(addInput);
    subOptionsDiv.appendChild(addBtn);

    // Insert after descrição
    meta.appendChild(subOptionsDiv);

    // --- Info badges ---
    const info = document.createElement('div');
    info.style.marginTop = '6px';

    const badge = document.createElement('span');
    badge.className = 'badge ' + t.priority;
    badge.textContent = t.priority;
    info.appendChild(badge);

    if (t.due) {
      const due = document.createElement('small');
      due.textContent = 'Prazo: ' + t.due;
      due.style.marginLeft = '6px';
      info.appendChild(due);
    }

    meta.appendChild(info);

    // --- Actions ---
    const actions = document.createElement('div');
    actions.className = 'actions';

    const doneBtn = document.createElement('button');
    doneBtn.className = 'small';
    doneBtn.textContent = t.done ? 'Reabrir' : 'Concluir';
    doneBtn.onclick = () => {
      t.done = !t.done;
      save();
      render();
    };

    const editBtn = document.createElement('button');
    editBtn.className = 'small';
    editBtn.textContent = 'Editar';
    editBtn.onclick = () => {
      titleInput.value = t.title;
      descInput.value = t.description || '';
      prioritySelect.value = t.priority || 'media';
      dueInput.value = t.due || '';
      addBtn.textContent = 'Salvar';
      addBtn.dataset.edit = t.id;
    };

    const delBtn = document.createElement('button');
    delBtn.className = 'small';
    delBtn.textContent = 'Excluir';
    delBtn.onclick = () => {
      if (confirm('Excluir esta tarefa?')) {
        tasks = tasks.filter((x) => x.id !== t.id);
        save();
        render();
      }
    };

    actions.appendChild(doneBtn);
    actions.appendChild(editBtn);
    actions.appendChild(delBtn);

    div.appendChild(meta);
    div.appendChild(actions);
    tasksList.appendChild(div);

    // Render drop zone after this card (or at the end)
    const nextRealIndex = realIndices[idx + 1] ?? tasks.length;
    tasksList.appendChild(createDropZone(nextRealIndex));
  });
}

addBtn.onclick = () => {
  const title = titleInput.value.trim();
  if (!title) return alert('Informe o título da tarefa.');

  const description = descInput.value.trim();
  const priority = prioritySelect.value;
  const due = dueInput.value || '';
  const editId = addBtn.dataset.edit;

  if (editId) {
    const idx = tasks.findIndex((t) => t.id === editId);
    if (idx !== -1) {
      tasks[idx].title = title;
      tasks[idx].description = description;
      tasks[idx].priority = priority;
      tasks[idx].due = due;
    }
    delete addBtn.dataset.edit;
    addBtn.textContent = 'Adicionar';
  } else {
    tasks.push({
      id: Date.now().toString(),
      title,
      description,
      priority,
      due,
      done: false,
      created: new Date().toISOString(),
      subOptions: [],           // <-- add this
      subOptionsDone: [],       // <-- and this
    });
  }

  titleInput.value = '';
  descInput.value = '';
  dueInput.value = '';
  prioritySelect.value = 'media';

  save();
  render();
};

search.oninput = render;
filterStatus.onchange = render;

clearBtn.onclick = () => {
  if (confirm('Remover todas as tarefas concluídas?')) {
    tasks = tasks.filter((t) => !t.done);
    save();
    render();
  }
};

// initial render
render();

filtered.forEach((t, idx) => {
  const div = document.createElement('div');
  div.className = 'task';
  div.draggable = true;
  // Store the real index in the main tasks array
  const realIndex = tasks.findIndex(task => task.id === t.id);
  div.dataset.index = realIndex;

  div.ondragstart = (e) => {
    e.dataTransfer.setData('text/plain', realIndex);
    div.classList.add('dragging');
  };
  div.ondragend = () => {
    div.classList.remove('dragging');
  };
  div.ondragover = (e) => {
    e.preventDefault();
    div.classList.add('drag-over');
  };
  div.ondragleave = () => {
    div.classList.remove('drag-over');
  };
  div.ondrop = (e) => {
    e.preventDefault();
    div.classList.remove('drag-over');
    const fromIdx = Number(e.dataTransfer.getData('text/plain'));
    const toIdx = Number(div.dataset.index);
    if (fromIdx !== toIdx) {
      const moved = tasks.splice(fromIdx, 1)[0];
      tasks.splice(toIdx, 0, moved);
      save();
      render();
    }
  };

  const meta = document.createElement('div');
  meta.className = 'meta';

  const title = document.createElement('h3');
  title.textContent = t.title;
  if (t.done) title.classList.add('done');

  const p = document.createElement('p');
  p.textContent = t.description || '';

  meta.appendChild(title);
  meta.appendChild(p);

  // --- Sub-options logic ---
  // Ensure subOptions and subOptionsDone exist for each task
  if (!t.subOptions) t.subOptions = [];
  if (!t.subOptionsDone) t.subOptionsDone = [];

  const subOptionsDiv = document.createElement('div');
  subOptionsDiv.className = 'sub-options-group';

  // List each sub-option as a radio with edit
  t.subOptions.forEach((label, idx) => {
    const radioWrapper = document.createElement('label');
    radioWrapper.className = 'custom-radio-wrapper';

    // Custom checkbox (Planner style)
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'custom-radio';
    checkbox.name = `suboption-${t.id}`;
    checkbox.id = `suboption-${t.id}-${idx}`;
    checkbox.checked = !!t.subOptionsDone[idx];

    // Toggle done state and editability
    checkbox.onchange = () => {
      t.subOptionsDone[idx] = checkbox.checked;
      save();
      render();
    };

    // Visual circle/checkmark
    const customCheck = document.createElement('span');
    customCheck.className = 'checkmark';

    // Editable text input
    const editInput = document.createElement('input');
    editInput.type = 'text';
    editInput.value = label;
    editInput.disabled = !!t.subOptionsDone[idx];
    editInput.className = 'suboption-edit';

    editInput.onchange = () => {
      t.subOptions[idx] = editInput.value;
      save();
      render();
    };

    // Remove button
    const removeBtn = document.createElement('button');
    removeBtn.textContent = '🗑️';
    removeBtn.className = 'small';
    removeBtn.onclick = (e) => {
      e.preventDefault();
      t.subOptions.splice(idx, 1);
      t.subOptionsDone.splice(idx, 1);
      save();
      render();
    };

    // Style for completed
    if (t.subOptionsDone[idx]) {
      editInput.style.textDecoration = 'line-through';
      editInput.style.opacity = '0.6';
    } else {
      editInput.style.textDecoration = '';
      editInput.style.opacity = '';
    }

    radioWrapper.appendChild(checkbox);
    radioWrapper.appendChild(customCheck);
    radioWrapper.appendChild(editInput);
    radioWrapper.appendChild(removeBtn);
    subOptionsDiv.appendChild(radioWrapper);
    subOptionsDiv.appendChild(document.createElement('br'));
  });

  // Add new sub-option input
  const addInput = document.createElement('input');
  addInput.type = 'text';
  addInput.placeholder = 'Checklist da Tarefa';
  addInput.className = 'suboption-add';
  addInput.style.marginRight = '6px';
  addInput.style.width = '180px';

  const addBtn = document.createElement('button');
  addBtn.textContent = '+';
  addBtn.className = 'small';
  addBtn.onclick = (e) => {
    e.preventDefault();
    const val = addInput.value.trim();
    if (val) {
      t.subOptions.push(val);
      t.subOptionsDone.push(false);
      save();
      render();
    }
  };

  subOptionsDiv.appendChild(addInput);
  subOptionsDiv.appendChild(addBtn);

  // Insert after descrição
  meta.appendChild(subOptionsDiv);

  // --- Info badges ---
  const info = document.createElement('div');
  info.style.marginTop = '6px';

  const badge = document.createElement('span');
  badge.className = 'badge ' + t.priority;
  badge.textContent = t.priority;
  info.appendChild(badge);

  if (t.due) {
    const due = document.createElement('small');
    due.textContent = 'Prazo: ' + t.due;
    due.style.marginLeft = '6px';
    info.appendChild(due);
  }

  meta.appendChild(info);

  // --- Actions ---
  const actions = document.createElement('div');
  actions.className = 'actions';

  const doneBtn = document.createElement('button');
  doneBtn.className = 'small';
  doneBtn.textContent = t.done ? 'Reabrir' : 'Concluir';
  doneBtn.onclick = () => {
    t.done = !t.done;
    save();
    render();
  };

  const editBtn = document.createElement('button');
  editBtn.className = 'small';
  editBtn.textContent = 'Editar';
  editBtn.onclick = () => {
    titleInput.value = t.title;
    descInput.value = t.description || '';
    prioritySelect.value = t.priority || 'media';
    dueInput.value = t.due || '';
    addBtn.textContent = 'Salvar';
    addBtn.dataset.edit = t.id;
  };

  const delBtn = document.createElement('button');
  delBtn.className = 'small';
  delBtn.textContent = 'Excluir';
  delBtn.onclick = () => {
    if (confirm('Excluir esta tarefa?')) {
      tasks = tasks.filter((x) => x.id !== t.id);
      save();
      render();
    }
  };

  actions.appendChild(doneBtn);
  actions.appendChild(editBtn);
  actions.appendChild(delBtn);

  div.appendChild(meta);
  div.appendChild(actions);
  tasksList.appendChild(div);
});

tasksList.ondragover = (e) => {
  e.preventDefault();
};
tasksList.ondrop = (e) => {
  e.preventDefault();
  const fromIdx = Number(e.dataTransfer.getData('text/plain'));
  // Move to end
  if (fromIdx !== tasks.length - 1) {
    const moved = tasks.splice(fromIdx, 1)[0];
    tasks.push(moved);
    save();
    render();
  }
};