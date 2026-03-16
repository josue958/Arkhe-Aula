<?php
/**
 * Arkhe Aula Web - Database Config
 */
$host = "localhost";
$db_name = "arkhe_aula_db";
$username = "root";
$password = "";

try {
    $conn = new PDO("mysql:host=$host;dbname=$db_name", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $conn->exec("set names utf8");
} catch(PDOException $exception) {
    // En producción, no mostrar el error detallado
    // echo "Error de conexión: " . $exception->getMessage();
}
?>
