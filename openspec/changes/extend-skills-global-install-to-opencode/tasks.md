## 1. Install script — core changes

- [ ] 1.1 Extend `install_skill` en el grupo 9 de `run_onchange_install-packages.sh.tmpl` para que, tras un `skills add` exitoso (y también cuando la skill ya está presente), cree `~/.config/opencode/skills/` con `mkdir -p` y ejecute `ln -sf "$HOME/.claude/skills/<name>" "$HOME/.config/opencode/skills/<name>"`.
- [ ] 1.2 Asegurar que el symlink NO se crea cuando `skills add` falla (flujo de error de `run_claude_step`).
- [ ] 1.3 Añadir la línea `install_skill "slidevjs/slidev" "slidev"` al final de la lista del grupo 9.

## 2. Non-macOS manual instructions

- [ ] 2.1 En la sección de instrucciones manuales (rama `{{ else }}` del template), añadir el comando de install para slidev: `npx -y skills add slidevjs/slidev --skill slidev -g -y`.
- [ ] 2.2 Añadir un bloque "Expose skills to OpenCode" que liste, para las once skills, el comando `ln -sf "$HOME/.claude/skills/<name>" "$HOME/.config/opencode/skills/<name>"` (incluyendo el `mkdir -p` previo).

## 3. Verificación

- [ ] 3.1 Ejecutar `chezmoi diff` sobre el template para confirmar que el script renderizado contiene los 11 `install_skill` y el nuevo bloque de symlinks.
- [ ] 3.2 Correr `chezmoi apply` en modo seco y verificar que tras la ejecución existen `~/.claude/skills/slidev/SKILL.md` y `~/.config/opencode/skills/slidev` como symlink válido a ese directorio.
- [ ] 3.3 Verificar idempotencia: ejecutar el `run_onchange` dos veces seguidas y confirmar que los symlinks quedan intactos y que no se reinstalan skills ya presentes.
- [ ] 3.4 Verificar el retrofit: sobre una máquina con `~/.claude/skills/pdf/` pero sin `~/.config/opencode/skills/pdf`, correr el script y comprobar que el symlink aparece.

## 4. Docs (opcional, evaluar al final)

- [ ] 4.1 Revisar `docs/manual.html` con la skill `docs:manual` y proponer una línea en la sección relevante de OpenCode/skills explicando que las skills globales aparecen symlinkadas en `~/.config/opencode/skills/`.
- [ ] 4.2 Revisar `README.md` con `docs:readme` y decidir si merece mención en la tabla "What's Included" o si se omite (probablemente se omite por ser detalle interno).

## 5. OpenSpec validation

- [ ] 5.1 `openspec validate extend-skills-global-install-to-opencode` pasa sin warnings ni errors.
- [ ] 5.2 `openspec verify extend-skills-global-install-to-opencode` pasa (todos los scenarios satisfechos por la implementación).
