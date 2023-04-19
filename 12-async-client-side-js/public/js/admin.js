const deleteProduct = (btn) => {
  const prodId = btn.parentNode.querySelector("[name=productId]").value;
  const csrf = btn.parentNode.querySelector("[name=_csrf]").value;

  const productElement = btn.closest("article");
  fetch(`/admin/product/${prodId}`, {
    method: "DELETE",
    headers: {
      "csrf-token": csrf, //csrf middleware will find it evn though it's not in body but in header
    },
  })
    .then((res) => {
      return res.json();
    })
    .then((data) => {
      console.log(data);
      productElement.remove();
    })
    .catch((err) => {
      console.log(err);
    });
};
