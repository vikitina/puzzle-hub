import { Route, Routes } from 'react-router-dom';
import PreferencesSync from '../preferences/preferences-sync';
import AppLayout from '../components/layout/app-layout';
import HomePage from '../pages/home-page';
import PuzzleInfoPage, { NotFoundPage } from '../pages/puzzle-info-page';
import SudokuPage from '../features/sudoku/sudoku-page';
import FillwordPage from '../features/fillword/fillword-page';
import NonogramPage from '../features/nonogram/nonogram-page';
import CodewordPage from '../features/codeword/codeword-page';
import ScanwordPage from '../features/scanword/scanword-page';

export default function App() {
  return (
    <>
      <PreferencesSync />
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<HomePage />} />
          <Route path="sudoku" element={<SudokuPage />} />
          <Route path="word-search" element={<FillwordPage />} />
          <Route path="nonogram" element={<NonogramPage />} />
          <Route path="codeword" element={<CodewordPage />} />
          <Route path="scanword" element={<ScanwordPage />} />
          <Route path=":puzzleId" element={<PuzzleInfoPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </>
  );
}