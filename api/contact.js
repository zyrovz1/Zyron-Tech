module.exports = async function handler(req, res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("X-Content-Type-Options", "nosniff");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({
      success: false,
      message: "Método não permitido."
    });
  }

  return res.status(503).json({
    success: false,
    message: "O formulário está temporariamente indisponível. Entre em contato pelos canais oficiais."
  });
};
