import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuthContext } from '../auth/AuthContext';

/**
 * Dossier client-side pour organiser les ranges. Persistance locale
 * (localStorage) cléée par utilisateur — évite une migration backend.
 */
export interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  children: Folder[];
  rangeIds: number[];
}

const ROOT_ID = 'root';
const ROOT_NAME = 'Toutes les Ranges';

/** Données sérialisables persistées : l'arbre sans la racine reconstruite. */
interface PersistedFolder {
  id: string;
  name: string;
  parentId: string | null;
  rangeIds: number[];
  children: PersistedFolder[];
}

const storageKey = (userId?: number) => `poker_tool_folders_${userId ?? 'anon'}`;

/** Reconstruit un arbre avec une racine contenant toutes les ranges non assignées. */
const buildTree = (persisted: PersistedFolder[], allRangeIds: number[]): Folder[] => {
  const assigned = new Set<number>();
  const collect = (nodes: PersistedFolder[]) => {
    for (const n of nodes) {
      n.rangeIds.forEach((id) => assigned.add(id));
      collect(n.children);
    }
  };
  collect(persisted);
  const rootRangeIds = allRangeIds.filter((id) => !assigned.has(id));
  const toFolder = (n: PersistedFolder): Folder => ({
    id: n.id,
    name: n.name,
    parentId: n.parentId,
    rangeIds: n.rangeIds,
    children: n.children.map(toFolder),
  });
  const root: Folder = {
    id: ROOT_ID,
    name: ROOT_NAME,
    parentId: null,
    children: persisted.map(toFolder),
    rangeIds: rootRangeIds,
  };
  return [root];
};

const load = (userId?: number): PersistedFolder[] => {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const save = (folders: PersistedFolder[], userId?: number) => {
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(folders));
  } catch {
    // ignore quota / serialization errors
  }
};

/** Sérialise l'arbre (sans la racine reconstruite) pour la persistance. */
const serialize = (root: Folder): PersistedFolder[] =>
  root.children.map((c) => ({
    id: c.id,
    name: c.name,
    parentId: c.parentId,
    rangeIds: c.rangeIds,
    children: serialize(c),
  }));

/**
 * Hook gérant l'arbre des dossiers + persistance localStorage.
 * @param allRangeIds IDs de toutes les ranges connues (pour reconstruire la racine).
 */
export function useRangeFolders(allRangeIds: number[]) {
  const { user } = useAuthContext();
  const userId = user?.id;
  const [folders, setFolders] = useState<Folder[]>([]);
  const allRangeIdsKey = allRangeIds.join(',');
  const allRangeIdsRef = useRef(allRangeIds);
  allRangeIdsRef.current = allRangeIds;

  // Recharge l'arbre quand l'utilisateur ou les ranges changent.
  useEffect(() => {
    setFolders(buildTree(load(userId), allRangeIds));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, allRangeIdsKey]);

  // Persist à chaque changement de l'arbre (hors racine reconstruite).
  useEffect(() => {
    if (folders.length === 0) return;
    save(serialize(folders[0]), userId);
  }, [folders, userId]);

  const createFolder = useCallback((name: string, parentId: string | null) => {
    const id = `folder_${Date.now()}`;
    const newFolder: Folder = {
      id,
      name,
      parentId,
      children: [],
      rangeIds: [],
    };
    setFolders((prev) => {
      if (!parentId) return [...prev, newFolder];
      const insert = (nodes: Folder[]): Folder[] =>
        nodes.map((f) =>
          f.id === parentId
            ? { ...f, children: [...f.children, newFolder] }
            : { ...f, children: insert(f.children) },
        );
      return insert(prev);
    });
    return id;
  }, []);

  /**
   * Déplace une range vers un dossier cible (et la retire de son dossier
   * actuel). `targetFolderId === ROOT_ID` désassigne la range (retour racine).
   */
  const moveRangeToFolder = useCallback((rangeId: number, targetFolderId: string) => {
    setFolders((prev) => {
      // Trouve le dossier courant de la range.
      const findCurrent = (nodes: Folder[]): string | null => {
        for (const n of nodes) {
          if (n.rangeIds.includes(rangeId)) return n.id;
          const sub = findCurrent(n.children);
          if (sub) return sub;
        }
        return null;
      };
      const currentFolderId = findCurrent(prev);
      if (currentFolderId === targetFolderId) return prev; // no-op

      const transfer = (nodes: Folder[]): Folder[] =>
        nodes.map((f) => {
          let rangeIds = f.rangeIds;
          if (f.id === currentFolderId) {
            rangeIds = rangeIds.filter((id) => id !== rangeId);
          }
          if (f.id === targetFolderId) {
            if (!rangeIds.includes(rangeId)) rangeIds = [...rangeIds, rangeId];
          }
          return { ...f, rangeIds, children: transfer(f.children) };
        });
      return transfer(prev);
    });
  }, []);

  const renameFolder = useCallback((folderId: string, name: string) => {
    setFolders((prev) => {
      const rename = (nodes: Folder[]): Folder[] =>
        nodes.map((f) =>
          f.id === folderId ? { ...f, name } : { ...f, children: rename(f.children) },
        );
      return rename(prev);
    });
  }, []);

  const deleteFolder = useCallback((folderId: string) => {
    setFolders((prev) => {
      // Remonte les ranges du dossier supprimé vers son parent.
      let rescued: number[] = [];
      let parentId: string | null = null;
      const find = (nodes: Folder[]): boolean => {
        for (const n of nodes) {
          if (n.id === folderId) {
            rescued = n.rangeIds;
            parentId = n.parentId;
            return true;
          }
          if (find(n.children)) return true;
        }
        return false;
      };
      find(prev);

      const remove = (nodes: Folder[]): Folder[] => {
        const filtered = nodes.filter((f) => f.id !== folderId);
        return filtered.map((f) => ({
          ...f,
          children: remove(f.children),
          rangeIds: f.id === parentId ? [...f.rangeIds, ...rescued] : f.rangeIds,
        }));
      };
      const next = remove(prev);
      // Si parent introuvable, remonte vers la racine.
      if (parentId && !next.some((f) => f.id === parentId)) {
        if (next.length > 0) {
          next[0] = { ...next[0], rangeIds: [...next[0].rangeIds, ...rescued] };
        }
      }
      return next;
    });
  }, []);

  return {
    folders,
    createFolder,
    moveRangeToFolder,
    renameFolder,
    deleteFolder,
  };
}
