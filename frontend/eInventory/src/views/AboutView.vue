<template>
  <div class="about">
    <h1>This is an about page</h1>
  </div>

  <button onclick="window.dialog.showModal();">open dialog</button>

<dialog id="dialog">
  I'm a dialog.
  <button onclick="window.dialog.close();">close</button>
</dialog>

<button onclick="window.dialog2.showModal();">open 2nd dialog</button>

<dialog id="dialog2">
  I'm a 2nd dialog.
  <button onclick="window.dialog2.close();">close</button>
</dialog>

<button onclick="window.dialog3.showModal();">open 3rd dialog</button>

<dialog id="dialog3">
  I'm a 3rd dialog.
  <button onclick="window.dialog3.close();">close</button>
</dialog>


  <!-- <button onclick="window.test.showModal(); displayCreate=true;">Add Product</button>

  <button onclick="window.dialog.showModal(); displayEdit=true;">Edit Product</button>
                    <dialog id="test">
                        <form action="">
                          AFAFHA
                          <div v-show="displayCreate === true">
                            CREATE

                          </div>
                            
                        </form>
                    <form method="dialog">
                        <button onclick="displayCreate=false; displayEdit=false;">Close</button>

                    </form>


                    </dialog>

                    <dialog id="dialog">
                        <form action="">
                            hghghgha
                          <div v-show="displayCreate === true">
                            CREATE

                          </div>
                            
                        </form>
                    <form method="dialog">
                        <button onclick="displayCreate=false; displayEdit=false;">Close</button>

                    </form>


                    </dialog> -->
</template>

<script lang="ts">
export default{
  data(){
    return {
      displayCreate: false,
      displayEdit: false,
    }
  },
}

</script>

<style>
@media (min-width: 1024px) {
  .about {
    min-height: 100vh;
    display: flex;
    align-items: center;
  }
}
</style>
