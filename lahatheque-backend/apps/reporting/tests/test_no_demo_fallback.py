"""
Garde-fou permanent : empêche la réintroduction du faux document de repli
"PromptBreeder_Original_Paper-2309.16797v1.pdf".
"""
import os
import shutil
import subprocess
from unittest import TestCase


class NoDemoFallbackTestCase(TestCase):
    FORBIDDEN_STRING = "PromptBreeder_Original_Paper"

    def _find_matches_pure_python(self, root_dir, extensions, exclude_dirs):
        """Recherche récursive portable en pur Python si grep n'est pas disponible."""
        matches = []
        for dirpath, dirnames, filenames in os.walk(root_dir):
            # Exclusion des dossiers proscrits en place
            dirnames[:] = [d for d in dirnames if d not in exclude_dirs]
            for fname in filenames:
                if any(fname.endswith(ext) for ext in extensions):
                    fpath = os.path.join(dirpath, fname)
                    try:
                        with open(fpath, "r", encoding="utf-8", errors="ignore") as f:
                            if self.FORBIDDEN_STRING in f.read():
                                matches.append(fpath)
                    except Exception:
                        pass
        return matches

    def test_no_reference_in_backend_source(self):
        backend_root = os.path.abspath(
            os.path.join(os.path.dirname(__file__), "..", "..", "..")
        )
        matches = []
        if shutil.which("grep"):
            result = subprocess.run(
                ["grep", "-r", "-l", self.FORBIDDEN_STRING, backend_root,
                 "--include=*.py", "--exclude-dir=migrations", "--exclude-dir=__pycache__",
                 "--exclude-dir=tests"],
                capture_output=True, text=True
            )
            matches = [line for line in result.stdout.splitlines() if line.strip()]
        else:
            matches = self._find_matches_pure_python(
                root_dir=backend_root,
                extensions=[".py"],
                exclude_dirs={"migrations", "__pycache__", "tests"}
            )

        self.assertEqual(
            matches, [],
            f"Le faux document de repli '{self.FORBIDDEN_STRING}' a été retrouvé dans : "
            f"{matches}. Voir les Fiches AB1-AB5."
        )

    def test_no_reference_in_frontend_source(self):
        frontend_root = os.path.abspath(
            os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "lahatheque-frontend")
        )
        if not os.path.isdir(frontend_root):
            self.skipTest("Dossier frontend introuvable depuis cet environnement de test.")

        matches = []
        if shutil.which("grep"):
            result = subprocess.run(
                ["grep", "-r", "-l", self.FORBIDDEN_STRING, frontend_root,
                 "--include=*.ts", "--include=*.tsx",
                 "--exclude-dir=node_modules", "--exclude-dir=.next"],
                capture_output=True, text=True
            )
            matches = [line for line in result.stdout.splitlines() if line.strip()]
        else:
            matches = self._find_matches_pure_python(
                root_dir=frontend_root,
                extensions=[".ts", ".tsx"],
                exclude_dirs={"node_modules", ".next"}
            )

        self.assertEqual(
            matches, [],
            f"Le faux document de repli '{self.FORBIDDEN_STRING}' a été retrouvé côté "
            f"frontend dans : {matches}."
        )
