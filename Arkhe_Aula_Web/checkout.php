<?php
/**
 * Arkhe Aula Web - Checkout Logic
 * Arkhe Group © 2026
 */

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $product_id = $_POST['product_id'] ?? 1;
    
    // Configuración de productos
    $products = [
        1 => ["name" => "Licencia Anual Arkhe Aula", "price" => 499.00],
        2 => ["name" => "Licencia Vitalicia Arkhe Aula", "price" => 1299.00]
    ];

    $product = $products[$product_id] ?? $products[1];

    // Nota: Aquí se integraría la API de PayPal o Stripe
    // Por ahora, simulamos el inicio de sesión para el proceso de compra
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Pasarela de Pago | Arkhe Aula</title>
    <link rel="stylesheet" href="css/style.css">
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;700&display=swap" rel="stylesheet">
    <style>
        .checkout-box {
            max-width: 500px;
            margin: 150px auto;
            background: var(--glass);
            border: 1px solid var(--glass-border);
            padding: 3rem;
            border-radius: 24px;
            text-align: center;
        }
        .item-detail {
            border-bottom: 1px solid var(--glass-border);
            padding-bottom: 1.5rem;
            margin-bottom: 2rem;
        }
        .methods {
            display: flex;
            flex-direction: column;
            gap: 1rem;
        }
        .btn-pay {
            display: block;
            padding: 1rem;
            border-radius: 12px;
            text-decoration: none;
            font-weight: bold;
            transition: 0.3s;
        }
        .paypal { background: #ffc439; color: #111; }
        .stripe { background: #635bff; color: white; }
    </style>
</head>
<body style="background: #030712;">
    <div class="checkout-box">
        <h2>Confirmar Compra</h2>
        <div class="item-detail">
            <p><?php echo $product['name']; ?></p>
            <h3 class="price">$<?php echo number_format($product['price'], 2); ?> MXN</h3>
        </div>
        
        <p style="margin-bottom: 1.5rem; color: #94a3b8;">Selecciona tu método de pago:</p>
        <div class="methods">
            <a href="#" class="btn-pay paypal">Pagar con PayPal <i class="fab fa-paypal"></i></a>
            <a href="#" class="btn-pay stripe">Pagar con Tarjeta <i class="fas fa-credit-card"></i></a>
        </div>
        
        <a href="index.php" style="display: block; margin-top: 2rem; color: #6366f1; text-decoration: none;">← Volver</a>
    </div>
</body>
</html>
