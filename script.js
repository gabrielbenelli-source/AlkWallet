$(document).ready(function() {
    // --- 1. CONFIGURACIÓN INICIAL Y DATOS ---
    // Inicializar saldo y movimientos si es la primera vez que se abre la app
    if (!localStorage.getItem('saldo')) localStorage.setItem('saldo', 500000);
    if (!localStorage.getItem('movimientos')) {
        const movIniciales = [
            { fecha: '2026-01-01', desc: 'Saldo Inicial', tipo: 'Ingreso', monto: 500000 }
        ];
        localStorage.setItem('movimientos', JSON.stringify(movIniciales));
    }

    const contactos = ["Andrés Soto", "Beatriz Luna", "Carlos Pérez", "Daniela Rivas", "Esteban Quito", "Francisca Jara"];

    // Funciones auxiliares para leer datos
    const obtenerSaldo = () => parseFloat(localStorage.getItem('saldo'));
    const obtenerMovimientos = () => JSON.parse(localStorage.getItem('movimientos'));
    
    // --- 2. FUNCIÓN DE ACTUALIZACIÓN UNIVERSAL (UI) ---
    // Esta función actualiza el saldo en CUALQUIER página donde se encuentre el ID
    const actualizarUI = () => {
        const saldo = obtenerSaldo();
        $('#displaySaldo, #saldoEnvio, #saldoVisual').text(`$${saldo.toLocaleString('es-CL')}`);
        
        // Si la tabla de movimientos existe en la página actual, la rellena
        if ($('#listaTransacciones').length) {
            cargarTransacciones();
        }
    };

    // Ejecutar actualización al cargar cualquier página
    actualizarUI();

    // --- 3. LOGICÁ DE LOGIN (index.html) ---
    $('#loginForm').on('submit', function(e) {
        e.preventDefault();
        const correo = $('#email').val();
        const clave = $('#password').val();

        if (correo === "GB" && clave === "GB") {
            localStorage.setItem('autenticado', 'true');
            window.location.href = 'menu.html';
        } else {
            alert("Acceso Denegado: Credenciales incorrectas (Use GB / GB)");
            $('#password').val('');
        }
    });

    // --- 4. LÓGICA DE DEPÓSITO (deposit.html) ---
    $('#formDeposito').on('submit', function(e) {
        e.preventDefault();
        const monto = parseFloat($('#montoDeposito').val());
        
        if (monto > 0) {
            const nuevoSaldo = obtenerSaldo() + monto;
            localStorage.setItem('saldo', nuevoSaldo);
            
            // Guardar en historial
            const movs = obtenerMovimientos();
            movs.push({ 
                fecha: new Date().toLocaleDateString(), 
                desc: 'Depósito ATM', 
                tipo: 'Ingreso', 
                monto: monto 
            });
            localStorage.setItem('movimientos', JSON.stringify(movs));

            // Animación de éxito en el saldo
            $('#saldoVisual').fadeOut(200, function() {
                $(this).text(`$${nuevoSaldo.toLocaleString('es-CL')}`)
                       .addClass('text-success fw-bold')
                       .fadeIn(200);
            });

            alert("¡Depósito exitoso!");
            actualizarUI();
            $(this).trigger("reset");

            // Quitar color verde después de unos segundos
            setTimeout(() => $('#saldoVisual').removeClass('text-success fw-bold'), 3000);
        }
    });

    // --- 5. LÓGICA DE TRANSFERENCIA (transfer.html) ---
    // Autocompletado de contactos
    $('#buscarContacto').on('keyup', function() {
        let texto = $(this).val().toLowerCase();
        let sugerencias = $('#listaSugerencias');
        sugerencias.empty().hide();

        if (texto.length > 0) {
            let filtrados = contactos.filter(c => c.toLowerCase().includes(texto));
            filtrados.forEach(c => {
                sugerencias.append(`<li class="list-group-item list-group-item-action">${c}</li>`);
            });
            if (filtrados.length > 0) sugerencias.show();
        }
    });

    // Seleccionar contacto de la lista
    $(document).on('click', '.list-group-item', function() {
        $('#buscarContacto').val($(this).text());
        $('#listaSugerencias').hide();
    });

    // Procesar envío de dinero
    $('#formEnviarDinero').on('submit', function(e) {
        e.preventDefault();
        const monto = parseFloat($('#montoEnviar').val());
        const destino = $('#buscarContacto').val();
        const saldoActual = obtenerSaldo();

        if (monto > 0 && monto <= saldoActual && destino !== "") {
            const nuevoSaldo = saldoActual - monto;
            localStorage.setItem('saldo', nuevoSaldo);

            // Guardar en historial
            const movs = obtenerMovimientos();
            movs.push({ 
                fecha: new Date().toLocaleDateString(), 
                desc: `Transferencia a ${destino}`, 
                tipo: 'Gasto', 
                monto: monto 
            });
            localStorage.setItem('movimientos', JSON.stringify(movs));

            alert(`Transferencia de $${monto.toLocaleString('es-CL')} enviada a ${destino}`);
            actualizarUI();
            $(this).trigger("reset");
        } else {
            alert("Error: Verifique el monto o que el destinatario no esté vacío.");
        }
    });

    // --- 6. RENDERIZAR TABLA (movimientos.html) ---
    function cargarTransacciones() {
        const tabla = $('#listaTransacciones');
        tabla.empty();
        
        // Mostrar los movimientos (del más nuevo al más viejo)
        obtenerMovimientos().reverse().forEach(m => {
            const colorMonto = m.tipo === 'Ingreso' ? 'text-success' : 'text-danger';
            const badgeTipo = m.tipo === 'Ingreso' ? 'bg-success' : 'bg-danger';
            const signo = m.tipo === 'Ingreso' ? '+' : '-';

            tabla.append(`
                <tr>
                    <td>${m.fecha}</td>
                    <td>${m.desc}</td>
                    <td><span class="badge ${badgeTipo}">${m.tipo}</span></td>
                    <td class="text-end fw-bold ${colorMonto}">${signo} $${m.monto.toLocaleString('es-CL')}</td>
                </tr>
            `);
        });
    }

    // --- 7. CERRAR SESIÓN ---
    $('#btnLogout').click(function() {
        localStorage.removeItem('autenticado');
        window.location.href = 'index.html';
    });
});