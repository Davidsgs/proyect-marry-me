// Enter que confirma una composición de IME (japonés, chino, coreano…): no debe
// enviar ni guardar. Safari puede entregar ese keydown con isComposing ya en
// false, por eso también se mira keyCode 229 (VK_PROCESSKEY).
export function isImeEnter(e: { nativeEvent: KeyboardEvent; keyCode: number }) {
    return e.nativeEvent.isComposing || e.keyCode === 229;
}
