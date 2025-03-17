"use client"

import { createContext, useContext, useState } from "react"
import Modal from "../components/Modal"

const ModalContext = createContext()

export const useModal = () => useContext(ModalContext)

export const ModalProvider = ({ children }) => {
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: "",
    content: null,
    type: "default",
  })

  const openModal = ({ title, content, type = "default" }) => {
    setModalState({
      isOpen: true,
      title,
      content,
      type,
    })
  }

  const closeModal = () => {
    setModalState({
      ...modalState,
      isOpen: false,
    })
  }

  const showError = (title, message) => {
    openModal({
      title: title || "Error",
      content: <p>{message}</p>,
      type: "error",
    })
  }

  const showSuccess = (title, message) => {
    openModal({
      title: title || "Success",
      content: <p>{message}</p>,
      type: "success",
    })
  }

  const showWarning = (title, message) => {
    openModal({
      title: title || "Warning",
      content: <p>{message}</p>,
      type: "warning",
    })
  }

  return (
    <ModalContext.Provider value={{ openModal, closeModal, showError, showSuccess, showWarning }}>
      {children}
      <Modal isOpen={modalState.isOpen} onClose={closeModal} title={modalState.title} type={modalState.type}>
        {modalState.content}
      </Modal>
    </ModalContext.Provider>
  )
}

