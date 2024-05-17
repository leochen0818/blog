(
  function () {
    class SuperGrid extends HTMLElement {
      static observedAttributes = ["config", "filter", 'key'];

      constructor() {
        super();

        const shadow = this.attachShadow({ mode: "open" });
        shadow.innerHTML = `
          <style>
            table {
              width: 100%;
            }
          </style>
          <h2></h2>
        `;
      }

      attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'config') {
          this.config = newValue ? JSON.parse(newValue) : newValue;
          this.key = this.config.id;
          this.headers = this.config.options.headers;
          this.originalData = this.config.options.data;
          this.usedData = this.config.options.data;
          this.sortableColumns = this.config.options.sortableColumns;
          this.shadowRoot.querySelector('h2').textContent = this.config.title;
          this.drawGrid();
        } else if (name === 'filter') {
          this.filter = newValue ? JSON.parse(newValue) : newValue;
          if (this.filter && this.headers.some(h => h.fieldId === this.filter.key)) {
            this.usedData = this.originalData.filter((d) => {
              if (!this.filter.value) {
                return true;
              }

              return d[this.filter.key].toString().toLowerCase().includes(this.filter.value.toLowerCase());
            });
            this.drawGridBody(this.shadowRoot.querySelector('tbody'));
          }
        }
      }

      drawGrid() {
        if (!this.config) {
          console.error('No config provided');
          return;
        }

        try {
          const table = document.createElement('table');
          const thead = document.createElement('thead');
          const tbody = document.createElement('tbody');
          table.appendChild(thead);
          table.appendChild(tbody);
          this.shadowRoot.appendChild(table);

          const trForHeader = document.createElement('tr');
          this.headers.forEach(({ fieldId, displayText }) => {
            const th = document.createElement('th');
            th.textContent = displayText;

            if (this.sortableColumns && this.sortableColumns.includes(fieldId)) {
              const button = document.createElement('button');
              th.appendChild(button);

              button.textContent = 'Sort';
              let sortDirection = '';
              button.addEventListener('click', () => {
                sortDirection = sortDirection === 'ASC' ? 'DESC' : 'ASC';
                button.textContent = `Sort: ${ sortDirection }`;
                this.usedData = this.usedData.sort((a, b) => {
                  if (sortDirection === 'ASC') {
                    return a[fieldId] > b[fieldId] ? 1 : -1;
                  } else {
                    return a[fieldId] < b[fieldId] ? 1 : -1;
                  }
                });
                this.drawGridBody(tbody);
                this.dispatchEvent(new CustomEvent('sort', {
                  detail: {
                    fieldId,
                    sortDirection,
                    key: this.key,
                  }
                }));
              });
            }

            trForHeader.appendChild(th);
          });
          thead.appendChild(trForHeader);

          this.drawGridBody(tbody);
        } catch (error) {
          console.error('Config Options Error:', error);
        }
      }

      drawGridBody(tbody) {
        const keys = this.headers.map(({ fieldId }) => fieldId);
        tbody.innerHTML = `${ this.usedData.map((data) => {
          return `<tr>${ keys.map((key) => {
            return `<td>${ data[key] }</td>`;
          }).join('') }</tr>`;
        }).join('') }`;
      }
    }

    // let the browser know about the custom element
    customElements.define('super-grid', SuperGrid);
  }
)();
