
class NeuralNetwork {
    
    constructor(input_nodes, hidden_nodes, output_nodes) {
      if (input_nodes instanceof tf.Sequential) {
          this.model = input_nodes;
          this.input_nodes = hidden_nodes;
          this.hidden_nodes = output_nodes;
          this.output_nodes = 2;
      } else {
          this.input_nodes = input_nodes;
          this.hidden_nodes = hidden_nodes;
          this.output_nodes = output_nodes;
          this.model = this.createModel();
      }
  }
  
    // On crée une copie du réseau de neurones, utilise peut être pour 
    // implémenter la mutation...
    copy() {
      return tf.tidy(() => {
        const modelCopy = this.createModel();
        const weights = this.model.getWeights();
        const weightCopies = [];
        for (let i = 0; i < weights.length; i++) {
          weightCopies[i] = weights[i].clone();
        }
        modelCopy.setWeights(weightCopies);
        return new NeuralNetwork(modelCopy, this.input_nodes, this.hidden_nodes, this.output_nodes);
      });
    }
  
    // Applique une mutation au "cerveau" de la voiture
    // rate est le taux de mutation
    // On applique la mutation sur les poids du réseau de neurones
    mutate(rate) {
      tf.tidy(() => {
        // On récupère le réseau de neurones
        // Ici les poids
        const weights = this.model.getWeights();
        // On crée un tableau pour les poids mutés
        const mutatedWeights = [];

        // Pour chaque poids
        for (let i = 0; i < weights.length; i++) {
          // On récupère le tenseur
          // qui contient les poids
          // et sa forme
          // et les valeurs
          let tensor = weights[i];
          let shape = weights[i].shape;
          let values = tensor.dataSync().slice();

          // Pour chaque valeur
          for (let j = 0; j < values.length; j++) {
            // On tire un nombre au hasard
            // si ce nombre est inférieur au taux de mutation
            // on ajoute un nombre aléatoire
            if (random(1) < rate) {
              let w = values[j];
              values[j] = w + randomGaussian();
            }
          }

          // On crée un nouveau tenseur avec les valeurs mutées
          let newTensor = tf.tensor(values, shape);
          mutatedWeights[i] = newTensor;
        }
        // On applique les poids mutés au réseau de neurones
        this.model.setWeights(mutatedWeights);
      });
    }
  
    dispose() {
      if (this.model) {
          try {
              this.model.dispose();
          } catch (error) {
              console.error('Error disposing model:', error);
          }
      }
  }

  
    // On prédit la sortie en fonction de l'entrée
    predict(inputs) {
      return tf.tidy(() => {
        // On convertit l'entrée en tenseur
        // et on prédit la sortie
        if (inputs.length !== this.input_nodes) {
          console.error(`Input size mismatch. Expected ${this.input_nodes}, got ${inputs.length}`);
          return [0.5, 0.5]; // Return safe default values
      }
        const xs = tf.tensor2d([inputs]);
        const ys = this.model.predict(xs);

        // On récupère les valeurs de la sortie
        const outputs = ys.dataSync();
        //console.log(outputs);
        return outputs;
      });
    }
  

        createModel() {
          const model = tf.sequential();
          
          // Input layer
          const hidden = tf.layers.dense({
              units: this.hidden_nodes,
              inputShape: [this.input_nodes],
              activation: 'sigmoid'
          });
          model.add(hidden);
  
          // Output layer
          const output = tf.layers.dense({
              units: this.output_nodes,
              activation: 'sigmoid'
          });
          model.add(output);
  
          return model;
      }

  }