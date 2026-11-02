const openMobileSidebar = () => {
  const menuBtn =
    document.querySelector('[data-tour="btn-mobile-menu"]') ||
    document.querySelector(".sidebar-toggle");
  if (menuBtn) menuBtn.click();
};

const closeMobileSidebar = () => {
  const closeBtn =
    document.querySelector('[data-tour="btn-close-sidebar"]') ||
    document.querySelector(".sidebar-close") ||
    document.querySelector(".sidebar-overlay") ||
    document.querySelector(".sidebar-backdrop");

  if (closeBtn) {
    closeBtn.click();
  }
};

export async function startHealthTour({ onCompleteTour, onCancelTour }) {
  const { driver } = await import("driver.js");
  await import("driver.js/dist/driver.css");

  const steps = [
    {
      element: '[data-tour="accounts"]',
      popover: { title: "Tus cuentas", description: "Acá cambiás entre tu cuenta personal y las grupales." },
      onHighlightStarted: () => {
        if (window.innerWidth <= 768) openMobileSidebar();
      },
    },
    {
      element: '[data-tour="new-account"]',
      popover: { title: "Nueva cuenta", description: "Creá una cuenta personal o una grupal para compartir gastos." },

    },
    {
      element: '[data-tour="info-account"]',
      popover: { title: "Información de cuenta", description: "Consultá los detalles de la cuenta activa o elimínala si ya no la necesitás." },
      onHighlightStarted: () => {
        if (window.innerWidth <= 768) closeMobileSidebar();
      },
    },
    {
      element: '[data-tour="icon-help"]',
      popover: { title: "Guía de uso", description: "Hacé clic acá en cualquier momento si querés volver a realizar la guía rápida." },
    },
    {
      element: '[data-tour="icon-theme"]',
      popover: { title: "Tema claro u oscuro", description: "Cambiá la apariencia visual de la aplicación según tu preferencia." },
    },
    {
      element: '[data-tour="icon-logout"]',
      popover: { title: "Cerrar sesión", description: "Salí de forma segura de tu cuenta en este dispositivo." },
    },
    {
      element: '[data-tour="period"]',
      popover: { title: "Filtro por mes", description: "Cambiá de mes y año para ver otros períodos." },
    },
    {
      element: '[data-tour="view-switch"]',
      popover: { title: "Cambiar de vista", description: "Alterná entre el resumen de Transacciones y el análisis de Salud Financiera." },
    },
    {
      element: '[data-tour="balance"]',
      popover: { title: "Tu balance", description: "Ingresos, egresos y el balance total del período elegido." },
    },
    {
      element: '[data-tour="expense-donut"]',
      popover: { title: "Distribución de gastos", description: "Visualizá qué porcentaje de tus gastos corresponde a cada categoría." },
    },
    {
      element: '[data-tour="income-donut"]',
      popover: { title: "Distribución de ingresos", description: "Analizá la procedencia de tus ingresos en el período." },
    },
    {
      element: '[data-tour="category-budgets"]',
      popover: { title: "Presupuestos por categoría", description: "Establecé límites mensuales de consumo y controlá si estás cerca de superarlos." },
    },
  ];

  let completedNormal = false;

  const d = driver({
    showProgress: true,
    nextBtnText: "Siguiente",
    prevBtnText: "Anterior",
    doneBtnText: "Siguiente",
    progressText: "{{current}} de {{total}}",
    steps,
    onDestroyed: () => {
      if (completedNormal) {
        if (onCompleteTour) onCompleteTour();
      } else {
        if (onCancelTour) onCancelTour();
      }
    },
  });
  steps[steps.length - 1].popover.onNextClick = () => {
    completedNormal = true;
    d.destroy();
  };

  d.drive();
}

export async function startTransactionsTour({ onFinishAll, onGoBack }) {
  const { driver } = await import("driver.js");
  await import("driver.js/dist/driver.css");

  const steps = [
    {
      element: '[data-tour="manage-categories"]',
      popover: { title: "Gestionar categorías", description: "Personalizá tus categorías y subcategorías de ingresos y gastos." },
    },
    {
      element: '[data-tour="add-transaction"]',
      popover: { title: "Agregar un registro", description: "Cargá un nuevo ingreso o gasto en la cuenta activa." },
    },
    {
      element: '[data-tour="transactions-table"]',
      popover: { title: "Historial de transacciones", description: "Lista detallada de todos los movimientos registrados en este período." },
    },
    {
      element: '[data-tour="payments"]',
      popover: { title: "Pagos del mes", description: "Compras en cuotas y pagos fijos. Se registran automáticamente en tus transacciones." },
    },
    {
      element: '[data-tour="add-payment"]',
      popover: { title: "Agregar pago planificado", description: "Programá compras en cuotas o servicios fijos recurrentes que se registrarán mes a mes." },
    },
    {
      element: '[data-tour="all-payment"]',
      popover: { title: "Ver todos los pagos", description: "Abrí el listado completo para revisar el detalle de cada compromiso." },
    },
  ];

  let isBack = false;

  steps[0].popover.onPrevClick = () => {
    isBack = true;
    d.destroy();
  };

  const d = driver({
    showProgress: true,
    nextBtnText: "Siguiente",
    prevBtnText: "Anterior",
    doneBtnText: "Listo",
    progressText: "{{current}} de {{total}}",
    steps,
    onDestroyed: () => {
      if (isBack) {
        if (onGoBack) onGoBack();
      } else {
        try { localStorage.setItem("tour_done", "1"); } catch {}
        if (onFinishAll) onFinishAll();
      }
    },
  });

  d.drive();
}

export async function startContentTour() {
  const { driver } = await import("driver.js");
  await import("driver.js/dist/driver.css");

  const steps = [
    {
      element: '[data-tour="period"]',
      popover: { title: "Filtro por mes", description: "Cambiá de mes y año para ver otros períodos." },
    },
    {
      element: '[data-tour="members"]',
      popover: { title: "Miembros", description: "Quiénes forman parte de la cuenta y la participación de cada uno." },
    },
    {
      element: '[data-tour="view-switch"]',
      popover: { title: "Cambiar de vista", description: "Alterná entre el resumen de Transacciones y el análisis de Salud Financiera." },
    },
    {
      element: '[data-tour="debts"]',
      popover: { title: "Deudas grupales", description: "Cálculo automático de quién le debe a quién para saldar cuentas fácilmente." },
    },
    {
      element: '[data-tour="manage-categories"]',
      popover: { title: "Gestionar categorías", description: "Personalizá tus categorías y subcategorías de ingresos y gastos." },
    },
    {
      element: '[data-tour="add-transaction"]',
      popover: { title: "Agregar un registro", description: "Cargá un nuevo ingreso o gasto en la cuenta activa." },
    },
    {
      element: '[data-tour="transactions-table"]',
      popover: { title: "Historial de transacciones", description: "Lista detallada de todos los movimientos registrados en este período." },
    },
    {
      element: '[data-tour="payments"]',
      popover: { title: "Pagos del mes", description: "Compras en cuotas y pagos fijos. Se registran automáticamente en tus transacciones." },
    },
    {
      element: '[data-tour="add-payment"]',
      popover: { title: "Agregar pago planificado", description: "Programá compras en cuotas o servicios fijos recurrentes que se registrarán mes a mes." },
    },
    {
      element: '[data-tour="all-payment"]',
      popover: { title: "Ver todos los pagos", description: "Abrí el listado completo para revisar el detalle de cada compromiso." },
    },
    {
      element: '[data-tour="balance"]',
      popover: { title: "Tu balance", description: "Ingresos, egresos y el balance total del período elegido." },
    },
    {
      element: '[data-tour="expense-donut"]',
      popover: { title: "Distribución de gastos", description: "Visualizá qué porcentaje de tus gastos corresponde a cada categoría." },
    },
    {
      element: '[data-tour="income-donut"]',
      popover: { title: "Distribución de ingresos", description: "Analizá la procedencia de tus ingresos en el período." },
    },
    {
      element: '[data-tour="category-budgets"]',
      popover: { title: "Presupuestos por categoría", description: "Establecé límites mensuales de consumo y controlá si estás cerca de superarlos." },
    },
  ].filter((s) => document.querySelector(s.element));

  const d = driver({
    showProgress: true,
    nextBtnText: "Siguiente",
    prevBtnText: "Anterior",
    doneBtnText: "Listo",
    progressText: "{{current}} de {{total}}",
    steps,
  });

  d.drive();
}