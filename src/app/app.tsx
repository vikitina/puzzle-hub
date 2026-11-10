import { Route, Routes } from 'react-router-dom';
import PreferencesSync from '../preferences/preferences-sync';
import AppLayout from '../components/layout/app-layout';
import HomePage from '../pages/home-page';
import PuzzleInfoPage, { NotFoundPage } from '../pages/puzzle-info-page';
import SudokuPage from '../features/sudoku/sudoku-page';
import FillwordPage from '../features/fillword/fillword-page';

export default function App() {
  return (
    <>
      <PreferencesSync />
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<HomePage />} />
          <Route path="sudoku" element={<SudokuPage />} />
          <Route path="word-search" element={<FillwordPage />} />
          <Route path=":puzzleId" element={<PuzzleInfoPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </>
  );
}