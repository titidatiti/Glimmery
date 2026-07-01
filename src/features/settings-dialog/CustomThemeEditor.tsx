import { useCallback, useEffect, useMemo, useState } from 'react';

import {

  BUILTIN_THEMES,

  DARK_BUILTIN_THEMES,

  LIGHT_BUILTIN_THEMES,

  THEME_COLOR_ROLE_DEFINITIONS,

  THEME_COLOR_ROLE_GROUPS,

  mergeColorRoles,

  mergeShadowRoles,

  mergeColorRolesWithBase,

  applyShadowRolesToBase,

  tokensToColorRoles,

  tokensToShadowRoles,

  useThemeStore,

  type ThemeColorRoleId,

  type ThemeColorRoles,

  type ThemeCustomSettings,

  type ThemeShadowRoles,

} from '@/core/themes';

import { setCustomThemeEditorActions } from './customThemeEditorBridge';

import styles from './CustomThemeEditor.module.css';



export interface CustomThemeEditorProps {

  editingThemeId?: string;

  onClose: () => void;

}



export function CustomThemeEditor({ editingThemeId, onClose }: CustomThemeEditorProps) {

  const themes = useThemeStore((s) => s.themes);

  const activeThemeId = useThemeStore((s) => s.activeThemeId);

  const addCustomTheme = useThemeStore((s) => s.addCustomTheme);

  const updateCustomThemeColors = useThemeStore((s) => s.updateCustomThemeColors);

  const deleteCustomTheme = useThemeStore((s) => s.deleteCustomTheme);

  const setPreviewTokens = useThemeStore((s) => s.setPreviewTokens);



  const editingTheme = editingThemeId

    ? themes.find((t) => t.id === editingThemeId && !t.isBuiltin)

    : undefined;



  const initialSource = editingTheme ?? themes.find((t) => t.id === activeThemeId) ?? BUILTIN_THEMES[0];



  const [name, setName] = useState(editingTheme?.name ?? '我的主题');

  const [baseThemeId, setBaseThemeId] = useState(

    editingTheme ? editingTheme.id : activeThemeId,

  );

  const [colorRoles, setColorRoles] = useState<ThemeColorRoles>(() =>

    tokensToColorRoles(initialSource.tokens.colors),

  );

  const [shadowRoles, setShadowRoles] = useState<ThemeShadowRoles>(() =>

    tokensToShadowRoles(initialSource.tokens),

  );



  const baseTheme = useMemo(

    () => themes.find((t) => t.id === baseThemeId) ?? BUILTIN_THEMES[0],

    [themes, baseThemeId],

  );



  const settings = useMemo<ThemeCustomSettings>(

    () => ({ colors: colorRoles, shadows: shadowRoles }),

    [colorRoles, shadowRoles],

  );



  const applyPreview = useCallback(

    (nextSettings: ThemeCustomSettings) => {

      setPreviewTokens({

        ...baseTheme.tokens,

        colors: mergeColorRolesWithBase(nextSettings.colors, baseTheme.tokens.colors),

        shadows: applyShadowRolesToBase(baseTheme.tokens.shadows, nextSettings.shadows),

      });

    },

    [baseTheme.tokens, setPreviewTokens],

  );



  useEffect(() => {

    applyPreview(settings);

    return () => setPreviewTokens(null);

  }, [settings, applyPreview, setPreviewTokens]);



  const handleBaseChange = (nextBaseId: string) => {

    setBaseThemeId(nextBaseId);

    const nextBase = themes.find((t) => t.id === nextBaseId) ?? BUILTIN_THEMES[0];

    setColorRoles(tokensToColorRoles(nextBase.tokens.colors));

    setShadowRoles({ ...tokensToShadowRoles(nextBase.tokens), customized: false });

  };



  const handleRoleChange = (roleId: ThemeColorRoleId, value: string) => {

    setColorRoles((prev) => mergeColorRoles(prev, { [roleId]: value }));

  };



  const handleShadowToggle = (enabled: boolean) => {
    setShadowRoles((prev) => mergeShadowRoles(prev, { shadowEnabled: enabled }));
  };

  const handleShadowColorChange = (value: string) => {
    setShadowRoles((prev) => mergeShadowRoles(prev, { shadowColor: value, customized: true }));
  };



  const handleSave = useCallback(() => {

    if (editingTheme) {

      updateCustomThemeColors(editingTheme.id, settings, name);

    } else {

      addCustomTheme(name, baseThemeId, settings);

    }

    onClose();

  }, [

    addCustomTheme,

    baseThemeId,

    editingTheme,

    name,

    onClose,

    settings,

    updateCustomThemeColors,

  ]);



  const handleCancel = useCallback(() => {

    setPreviewTokens(null);

    onClose();

  }, [onClose, setPreviewTokens]);



  const handleDelete = useCallback(() => {

    if (!editingTheme) return;

    const confirmed = window.confirm(`确定删除主题「${editingTheme.name}」？此操作不可撤销。`);

    if (!confirmed) return;

    setPreviewTokens(null);

    deleteCustomTheme(editingTheme.id);

    onClose();

  }, [deleteCustomTheme, editingTheme, onClose, setPreviewTokens]);



  useEffect(() => {

    setCustomThemeEditorActions({

      onSave: handleSave,

      onCancel: handleCancel,

      onDelete: editingTheme ? handleDelete : undefined,

    });

    return () => setCustomThemeEditorActions(null);

  }, [editingTheme, handleCancel, handleDelete, handleSave]);



  return (

    <div className={styles.editor}>

      <div className={styles.controls}>

        <label className={styles.field}>

          <span className={styles.fieldLabel}>主题名称</span>

          <input

            className={styles.input}

            value={name}

            onChange={(e) => setName(e.target.value)}

            placeholder="我的主题"

          />

        </label>



        {!editingTheme && (

          <label className={styles.field}>

            <span className={styles.fieldLabel}>基于主题</span>

            <select

              className={styles.select}

              value={baseThemeId}

              onChange={(e) => handleBaseChange(e.target.value)}

            >

              <optgroup label="深色主题">

                {DARK_BUILTIN_THEMES.map((t) => (

                  <option key={t.id} value={t.id}>

                    {t.name}

                  </option>

                ))}

              </optgroup>

              <optgroup label="浅色主题">

                {LIGHT_BUILTIN_THEMES.map((t) => (

                  <option key={t.id} value={t.id}>

                    {t.name}

                  </option>

                ))}

              </optgroup>

            </select>

          </label>

        )}



        {THEME_COLOR_ROLE_GROUPS.map((group) => (

          <section key={group.id} className={styles.roleGroup}>

            <h4 className={styles.groupTitle}>{group.label}</h4>

            <div className={styles.roleList}>

              {THEME_COLOR_ROLE_DEFINITIONS.filter((d) => d.group === group.id).map((def) => (

                <label key={def.id} className={styles.colorField}>

                  <span className={styles.colorMeta}>

                    <span className={styles.colorLabel}>{def.label}</span>

                    <span className={styles.colorHint}>{def.hint}</span>

                  </span>

                  <input

                    type="color"

                    className={styles.colorInput}

                    value={colorRoles[def.id]}

                    onChange={(e) => handleRoleChange(def.id, e.target.value)}

                    aria-label={def.label}

                  />

                </label>

              ))}

            </div>

          </section>

        ))}



        <section className={styles.roleGroup}>
          <h4 className={styles.groupTitle}>阴影</h4>
          <div className={styles.roleList}>
            <div className={styles.colorField}>
              <div className={styles.colorMeta}>
                <label className={styles.toggleLabel}>
                  <input
                    type="checkbox"
                    className={styles.toggleInput}
                    checked={shadowRoles.shadowEnabled}
                    onChange={(e) => handleShadowToggle(e.target.checked)}
                  />
                  <span className={styles.colorLabel}>启用阴影</span>
                </label>
                <span className={styles.colorHint}>设置对话框、卡片等区域的投影色</span>
              </div>
              <input
                type="color"
                className={styles.colorInput}
                value={shadowRoles.shadowColor}
                disabled={!shadowRoles.shadowEnabled}
                onChange={(e) => handleShadowColorChange(e.target.value)}
                aria-label="阴影色"
              />
            </div>
          </div>
        </section>

      </div>

    </div>

  );

}


