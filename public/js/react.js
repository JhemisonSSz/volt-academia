// react.js — Traz o React e o htm direto do CDN (sem npm, sem build).
// O htm deixa escrever HTML dentro do JS com crases: html`<div>${valor}</div>`.
// As versões ficam fixas para o site não mudar sozinho quando sair versão nova.
import React from "https://esm.sh/react@18.3.1";
import { createRoot } from "https://esm.sh/react-dom@18.3.1/client?deps=react@18.3.1";
import htm from "https://esm.sh/htm@3.1.1";

export const html = htm.bind(React.createElement);
export const { useState, useEffect, useMemo, useRef, useCallback, createContext, useContext } = React;
export { React, createRoot };
